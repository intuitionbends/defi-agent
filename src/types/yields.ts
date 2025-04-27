export type PoolYieldRecord = {
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