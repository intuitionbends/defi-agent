import { Chain, DataSource } from "./enums";

export interface AvailableInteraction {
  chain: Chain;
  project: string;
  name: string;
  args: string;
  created_at: Date;
  updated_at: Date;
}

export interface InsightAgentInput {
  preferences: {
    riskTolerance: RiskTolerance;
    maxDrawdown: number;
    capitalSize: number;
    investmentTimeframe: number;
  };
  pools: any[];
  sentiment?: string;
  contracts?: any[];
}

export interface MappingInput {
  chain?: Chain;
  riskTolerance: RiskTolerance;
  maxDrawdown: number;
  capitalSize: number; // TODO: USDT/ USDC
  investmentTimeframe: number;
  assetSymbol: string;
  limit?: number;
}

// Interface for yield-suggestion pipeline
export interface UserPreferences {
  chain: Chain;
  riskTolerance: RiskTolerance;
  maxDrawdown: number;
  capitalSize: number;
  investmentTimeframe: number;
  assetSymbol: string;
}

export enum InvestmentTimeframe {
  _30_DAYS = 30,
  _90_DAYS = 90,
  _180_DAYS = 180,
}

export enum RiskTolerance {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export interface PoolYield {
  id?: number;
  originalId: string;
  dataSource: DataSource;
  chain: Chain;
  symbol: string;
  project: string;
  apy: number;
  apyBase: number;
  apyBase7d: number | null;
  apyMean30d: number | null;
  apyPct1d: number | null;
  apyPct7d: number | null;
  apyPct30d: number | null;
  tvlUsd: number;
  createdAt: Date;
  updatedAt: Date;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const anyToPoolYield = (data: any): PoolYield => {
  return {
    originalId: data.original_id,
    dataSource: data.data_source,
    chain: data.chain as Chain,
    symbol: data.symbol,
    project: data.project,
    apy: parseFloat(data.apy),
    apyBase: data.apy_base ? parseFloat(data.apy_base) : null,
    apyBase7d: data.apy_base_7d ? parseFloat(data.apy_base_7d) : null,
    apyMean30d: data.apy_mean_30d ? parseFloat(data.apy_mean_30d) : null,
    apyPct1d: data.apy_pct_1d ? parseFloat(data.apy_pct_1d) : null,
    apyPct7d: data.apy_pct_7d ? parseFloat(data.apy_pct_7d) : null,
    apyPct30d: data.apy_pct_30d ? parseFloat(data.apy_pct_30d) : null,
    tvlUsd: parseFloat(data.tvl_usd),
  } as PoolYield;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const anyToAvailableInteraction = (data: any): AvailableInteraction => {
  return {
    chain: data.chain,
    project: data.project,
    name: data.name,
    args: data.args,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as AvailableInteraction;
};
