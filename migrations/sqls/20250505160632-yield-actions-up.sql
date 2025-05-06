CREATE TABLE yield_actions (
  id SERIAL PRIMARY KEY,
  yield_suggestion_id INTEGER NOT NULL REFERENCES yield_suggestions(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  wallet_address VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  yield_action_type INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yield_actions_suggestion_id ON yield_actions(yield_suggestion_id);
