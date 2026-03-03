-- Migration to add Telegram connection fields

-- Add telegram connection tracking columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_token VARCHAR;
