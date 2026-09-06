-- Add category column to suggestions table if not already present
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';
