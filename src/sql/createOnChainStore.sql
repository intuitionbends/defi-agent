create table if not exists apy_history (
  id uuid default uuid_generate_v4() primary key,
  pool_id text not null,
  asset text,
  chain text,
  apy numeric,
  tvl numeric,
  timestamp timestamptz not null,
  apy_base numeric,
  apy_reward numeric,
  apy_mean_30d numeric,
  apy_change_1d numeric,
  apy_change_7d numeric,
  apy_change_30d numeric,
  data_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_tweeted boolean default false,
  constraint apy_history_unique_pool_timestamp unique (pool_id, timestamp)
);

create index if not exists apy_history_timestamp_idx on apy_history(timestamp desc);
