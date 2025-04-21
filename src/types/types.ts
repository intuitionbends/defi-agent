import { Chain, DataSource } from "./enums";

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

export const anyToPoolYield = (data: any): PoolYield => {
  return {
    originalId: data.original_id,
    dataSource: data.data_source,
    chain: data.chain,
    symbol: data.symbol,
    project: data.project,
    apy: data.apy,
    apyBase: data.apy_base,
    apyBase7d: data.apy_base_7d,
    apyMean30d: data.apy_mean_30d,
    apyPct1d: data.apy_pct_1d,
    apyPct7d: data.apy_pct_7d,
    apyPct30d: data.apy_pct_30d,
    tvlUsd: data.tvl_usd,
  } as PoolYield;
};
