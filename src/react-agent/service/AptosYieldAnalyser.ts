
// src/services/AptosYieldAnalyzer.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_KEY as string);

type PoolYieldRecord = {
  original_id: string;
  data_source: number;
  chain: string;
  symbol: string;
  project: string;
  apy: number;
  apy_base: number;
  apy_base_7d: number;
  apy_mean_30d: number;
  apy_pct_1d: number;
  apy_pct_7d: number;
  apy_pct_30d: number;
  tvl_usd: number;
};

export class AptosYieldAnalyser {
  async getTopAptosPools(limit = 5, minTvl = 100000): Promise<PoolYieldRecord[]> {
    const { data, error } = await supabase
      .from("pool_yields")
      .select("*")
      .eq("chain", "Aptos")
      .order("apy", { ascending: false });

    if (error) {
      console.error("Error fetching Aptos data:", error.message);
      return [];
    }

    const filtered = (data || []).filter(
      (pool) => pool.tvl_usd > minTvl && pool.apy > 0
    );
    return filtered.slice(0, limit);
  }

  async groupBySymbol(): Promise<Record<string, PoolYieldRecord[]>> {
    const { data, error } = await supabase
      .from("pool_yields")
      .select("*")
      .eq("chain", "Aptos");

    if (error) {
      console.error("Error grouping by symbol:", error.message);
      return {};
    }

    const grouped: Record<string, PoolYieldRecord[]> = {};
    for (const pool of data || []) {
      if (!grouped[pool.symbol]) {
        grouped[pool.symbol] = [];
      }
      grouped[pool.symbol].push(pool);
    }
    return grouped;
  }

  async findBestPoolPerSymbol(): Promise<PoolYieldRecord[]> {
    const grouped = await this.groupBySymbol();
    const bestPools: PoolYieldRecord[] = [];

    for (const symbol in grouped) {
      const sorted = grouped[symbol].sort((a, b) => b.apy - a.apy);
      if (sorted[0]) {
        bestPools.push(sorted[0]);
      }
    }

    return bestPools;
  }

  async getTopStablecoinPools(limit = 5): Promise<PoolYieldRecord[]> {
    const stablecoins = [
      "USDC", "USDT", "zUSDC", "USDP", "DAI",
      "BUSD", "ZUSDC", "ZUSDT", "TUSD"
    ];

    const { data, error } = await supabase
      .from("pool_yields")
      .select("*")
      .eq("chain", "Aptos");

    if (error) {
      console.error("Error fetching stablecoin pools:", error.message);
      return [];
    }

    const stablePools = (data || []).filter(
      (pool) =>
        stablecoins.includes(pool.symbol.toUpperCase()) &&
        pool.apy > 0 &&
        pool.tvl_usd > 0
    );

    const sorted = stablePools.sort((a, b) => b.apy - a.apy);
    return sorted.slice(0, limit);
  }
}

async function main() {
  const analyzer = new AptosYieldAnalyser();

  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
  }

  console.log("Top 5 Yielding Aptos Pools:");
  const topPools = await analyzer.getTopAptosPools(5);
  topPools.forEach((pool, index) => {
    console.log(
      `${index + 1}. ${pool.symbol} | ${pool.apy.toFixed(2)}% APY | ${pool.tvl_usd.toLocaleString()} TVL`
    );
  });
}

main().catch(console.error);