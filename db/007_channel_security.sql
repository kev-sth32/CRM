ALTER TABLE channels ADD COLUMN IF NOT EXISTS inbound_token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS channels_inbound_token_idx ON channels(inbound_token_hash) WHERE inbound_token_hash IS NOT NULL;
