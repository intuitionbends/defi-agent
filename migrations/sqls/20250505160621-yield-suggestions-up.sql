CREATE TABLE yield_suggestions (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  insight TEXT NOT NULL,
  symbol VARCHAR NOT NULL,
  investment_timeframe INTEGER NOT NULL,
  risk_tolerance INTEGER NOT NULL,
  chain SMALLINT NOT NULL,
  project VARCHAR NOT NULL,
  data_source SMALLINT NOT NULL,
  is_actionable BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yield_suggestions_timestamp ON yield_suggestions(timestamp);
