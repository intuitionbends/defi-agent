CREATE TABLE actions (
  suggestion_id INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  tx_data TEXT NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (suggestion_id, sequence_number)
);

CREATE INDEX idx_actions_suggestion_id ON actions(suggestion_id);