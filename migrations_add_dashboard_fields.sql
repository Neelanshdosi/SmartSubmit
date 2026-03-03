-- Run this in your Supabase SQL editor if your tables already exist.
-- Adds columns required for the dashboard feature.

-- Add whatsapp_enabled to users (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;

-- Add is_submitted to assignments (if not exists)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT FALSE;

-- Add google_course_work_id to assignments (prevents duplicates when due date changes)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS google_course_work_id VARCHAR;
