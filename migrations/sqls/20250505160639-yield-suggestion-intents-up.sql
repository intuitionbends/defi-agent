CREATE TABLE yield_suggestion_intents (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR NOT NULL,
  yield_suggestion_id INTEGER NOT NULL REFERENCES yield_suggestions(id),
  asset_amount NUMERIC NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_yield_suggestion_intents_yield_suggestion_id_status ON yield_suggestion_intents(yield_suggestion_id, status);

CREATE INDEX idx_yield_suggestion_intents_wallet_address_status ON yield_suggestion_intents(wallet_address, status);