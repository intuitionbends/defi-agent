import axios, { Axios } from "axios";
import * as winston from "winston";
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

export interface DefillamaEnrichedPool {
  pool: string;
  timestamp: Date;
  project: string;
  chain: string;
  symbol: string;
  poolMeta: string | null;
  underlyingTokens: string[];
  rewardTokens: string[];
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  il7d: number | null;
  apyBase7d: number | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  apyBaseInception: number | null;
  url: string | null;
  apyPct1d: number | null;
  apyPct7d: number | null;
  apyPct30d: number | null;
  apyMean30d: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  returnValue: number | null;
  count: number;
  apyMeanExpanding: number | null;
  apyStdExpanding: number | null;
  mu: number;
  sigma: number;
  outlier: boolean;
  projectFactorized: number | null;
  chainFactorized: number | null;
  predictedClass: string | null;
  predictedProbability: number | null;
  binnedConfidence: number | null;
  poolOld: string | null;
  createdAt: Date;
  updatedAt: Date;
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

  async getEnrichedPool(id: string): Promise<DefillamaEnrichedPool | null> {
    try {
      const response = await this.client.get(`https://yields.llama.fi/poolsEnriched?pool=${id}`);
      const data: any = response.data?.data || [];

      if (!data || data.length === 0) {
        return null;
      }

      const enrichedPool = dataToDefillamaEnrichedPool(data[0]);

      return enrichedPool;
    } catch (error) {
      this.logger.error(`error fetching enriched pool data: ${error}`);
      return null;
    }
  }
}

const dataToDefillamaEnrichedPool = (data: any): DefillamaEnrichedPool => {
  return {
    pool: data.pool,
    timestamp: new Date(data.timestamp),
    project: data.project,
    chain: data.chain,
    symbol: data.symbol,
    poolMeta: data.poolMeta,
    underlyingTokens: data.underlyingTokens,
    rewardTokens: data.rewardTokens,
    tvlUsd: data.tvlUsd,
    apy: data.apy,
    apyBase: data.apyBase,
    apyReward: data.apyReward,
    il7d: data.il7d,
    apyBase7d: data.apyBase7d,
    volumeUsd1d: data.volumeUsd1d,
    volumeUsd7d: data.volumeUsd7d,
    apyBaseInception: data.apyBaseInception,
    url: data.url,
    apyPct1d: data.apyPct1D,
    apyPct7d: data.apyPct7D,
    apyPct30d: data.apyPct30D,
    apyMean30d: data.apyMean30d,
    stablecoin: data.stablecoin,
    ilRisk: data.ilRisk,
    exposure: data.exposure,
    returnValue: data.return,
    count: data.count,
    apyMeanExpanding: data.apyMeanExpanding,
    apyStdExpanding: data.apyStdExpanding,
    mu: data.mu,
    sigma: data.sigma,
    outlier: data.outlier,
    projectFactorized: data.project_factorized,
    chainFactorized: data.chain_factorized,
    predictedClass: data.predictions.predictedClass,
    predictedProbability: data.predictions.predictedProbability,
    binnedConfidence: data.predictions.binnedConfidence,
    poolOld: data.pool_old,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as DefillamaEnrichedPool;
};
