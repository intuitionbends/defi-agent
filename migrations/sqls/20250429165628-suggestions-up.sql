CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  summary TEXT NOT NULL,
  status SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suggestions_wallet_address ON suggestions(wallet_address);
