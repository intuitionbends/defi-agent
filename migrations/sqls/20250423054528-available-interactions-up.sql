create table if not exists available_interactions (
  chain text not null,
  project varchar not null,
  name varchar not null,
  args JSONB,
  created_at timestamp with time zone default timezone('utc' :: text, now()) not null,
  updated_at timestamp with time zone default timezone('utc' :: text, now()) not null,
  PRIMARY KEY (chain, project, name)
);