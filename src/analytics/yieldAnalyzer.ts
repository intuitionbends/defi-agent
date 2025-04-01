// src/services/AptosYieldAnalyzer.ts
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config/env";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type ApyRecord = {
  pool_id: string;
  asset: string;
  chain: string;
  apy: number;
  tvl: number;
  apy_base?: number;
  apy_reward?: number;
};

export class AptosYieldAnalyzer {
  async getTopAptosPools(limit = 5, minTvl = 100000): Promise<ApyRecord[]> {
    const { data, error } = await supabase
      .from("apy_snapshot")
      .select("pool_id, asset, chain, apy, tvl, apy_base, apy_reward")
      .eq("chain", "Aptos")
      .order("apy", { ascending: false });

    if (error) {
      console.error("Error fetching Aptos data:", error.message);
      return [];
    }

    // Filter out low TVL or invalid data
    const filtered = (data || []).filter(
      (pool) => pool.tvl > minTvl && pool.apy > 0
    );
    return filtered.slice(0, limit);
  }

  async groupByAsset(): Promise<Record<string, ApyRecord[]>> {
    const { data, error } = await supabase
      .from("apy_snapshot")
      .select("pool_id, asset, chain, apy, tvl")
      .eq("chain", "Aptos");

    if (error) {
      console.error("Error grouping by asset:", error.message);
      return {};
    }

    const grouped: Record<string, ApyRecord[]> = {};
    for (const pool of data || []) {
      if (!grouped[pool.asset]) {
        grouped[pool.asset] = [];
      }
      grouped[pool.asset].push(pool);
    }
    return grouped;
  }

  async findBestPoolPerAsset(): Promise<ApyRecord[]> {
    const grouped = await this.groupByAsset();
    const bestPools: ApyRecord[] = [];

    for (const asset in grouped) {
      const sorted = grouped[asset].sort((a, b) => b.apy - a.apy);
      if (sorted[0]) {
        bestPools.push(sorted[0]);
      }
    }

    return bestPools;
  }
}

async function main() {
  const analyzer = new AptosYieldAnalyzer();

  console.log("Top 5 Yielding Aptos Pools:");
  const topPools = await analyzer.getTopAptosPools(5);
  topPools.forEach((pool, index) => {
    console.log(
      `${index + 1}. ${pool.asset} | ${pool.apy.toFixed(
        2
      )}% APY | ${pool.tvl.toLocaleString()} TVL | ${pool.pool_id}`
    );
  });

  console.log("\n Best Pool per Asset:");
  const bestPools = await analyzer.findBestPoolPerAsset();
  bestPools.forEach((pool) => {
    console.log(
      `- ${pool.asset}: ${pool.apy.toFixed(2)}% APY | ${pool.pool_id}`
    );
  });
}

// Only run `main()` if this file is executed directly
if (require.main === module) {
  main();
}
