CREATE TABLE yield_suggestions (
  id SERIAL PRIMARY KEY,
  insight TEXT NOT NULL,
  is_actionable BOOLEAN NOT NULL,
  symbol VARCHAR NOT NULL,
  investment_timeframe INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  risk_tolerance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yield_suggestions_symbol ON yield_suggestions(symbol);
