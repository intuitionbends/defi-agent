import axios, { Axios } from "axios";
import winston from "winston";
import { Chain, DataSource, normalizeChain } from "../types/enums";
import { PoolYield } from "../types/types";

interface DefillamaPoolYield {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: null | string;
    predictedProbability: null | number;
    binnedConfidence: null | string;
  };
  poolMeta: null | string;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[];
  il7d: null | number;
  apyBase7d: null | number;
  apyMean30d: number;
  volumeUsd1d: null | number;
  volumeUsd7d: null | number;
  apyBaseInception: null | number;
}

const normalizeDefillamaPoolYield = (poolYield: DefillamaPoolYield): PoolYield => {
  const normalizedYield = {
    originalId: poolYield.pool,
    dataSource: DataSource.Defillama,
    chain: normalizeChain(poolYield.chain),
    symbol: poolYield.symbol,
    project: poolYield.project,
    apy: poolYield.apy,
    apyBase: poolYield.apyBase,
    apyBase7d: poolYield.apyBase7d,
    apyMean30d: poolYield.apyMean30d,
    apyPct1d: poolYield.apyPct1D,
    apyPct7d: poolYield.apyPct7D,
    apyPct30d: poolYield.apyPct30D,
    tvlUsd: poolYield.tvlUsd,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PoolYield;

  return normalizedYield;
};

export class DefiLlama {
  private logger: winston.Logger;
  private client: Axios;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.client = axios.create({});
  }

  async getPoolYields(chains: Chain[]): Promise<PoolYield[]> {
    try {
      const response = await this.client.get("https://yields.llama.fi/pools");
      const yields: DefillamaPoolYield[] = response.data?.data || [];

      const poolYields = yields
        .map(normalizeDefillamaPoolYield)
        .filter((pool: PoolYield) => chains.includes(pool.chain));

      return poolYields;
    } catch (error) {
      this.logger.error(`error fetching pool data: ${error}`);
      return [];
    }
  }
}
