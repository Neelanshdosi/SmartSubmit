-- Migration to add Telegram reminder fields

-- Add Telegram enabled flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT TRUE;

-- Add Telegram reminder tracking columns to assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_3d BOOLEAN DEFAULT FALSE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_1d BOOLEAN DEFAULT FALSE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS reminded_12h BOOLEAN DEFAULT FALSE;
