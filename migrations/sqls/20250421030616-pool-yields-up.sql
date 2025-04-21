create table if not exists pool_yields (
  original_id varchar,
  data_source integer,
  chain varchar not null,
  symbol varchar not null,
  project varchar not null,
  apy numeric,
  apy_base numeric,
  apy_base_7d numeric,
  apy_mean_30d numeric,
  apy_pct_1d numeric,
  apy_pct_7d numeric,
  apy_pct_30d numeric,
  tvl_usd numeric,
  created_at timestamp with time zone default timezone('utc' :: text, now()) not null,
  updated_at timestamp with time zone default timezone('utc' :: text, now()) not null,
  PRIMARY KEY (original_id, data_source)
);

create index idx_pool_yields_chain_symbol_project on pool_yields(chain, symbol, project);