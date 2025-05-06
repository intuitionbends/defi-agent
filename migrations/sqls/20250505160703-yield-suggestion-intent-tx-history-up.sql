CREATE TABLE yield_suggestion_intent_tx_history (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR NOT NULL,
  yield_suggestion_id INTEGER NOT NULL REFERENCES yield_suggestions(id),
  sequence_number INTEGER NOT NULL,
  yield_suggestion_intent_id INTEGER NOT NULL REFERENCES yield_suggestion_intents(id),
  tx_hash VARCHAR NOT NULL,
  tx_status INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_yield_suggestion_intent_tx_history_wallet_address ON yield_suggestion_intent_tx_history(wallet_address);
