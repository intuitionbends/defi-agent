CREATE TABLE yield_suggestion_intents (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR NOT NULL,
  yield_suggestion_id INTEGER NOT NULL REFERENCES yield_suggestions(id),
  asset_amount NUMERIC NOT NULL,
  current_sequence_number INTEGER NOT NULL DEFAULT 1,
  status INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_yield_suggestion_intents_wallet_address ON yield_suggestion_intents(wallet_address);
CREATE INDEX idx_yield_suggestion_intents_status ON yield_suggestion_intents(status);
