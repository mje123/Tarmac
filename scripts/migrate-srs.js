/**
 * Run once to create the srs_cards table:
 *   node scripts/migrate-srs.js
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS srs_cards (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      due_at timestamptz NOT NULL DEFAULT now(),
      interval_days integer NOT NULL DEFAULT 1,
      ease_factor numeric NOT NULL DEFAULT 2.5,
      repetitions integer NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(user_id, question_id)
    );
    CREATE INDEX IF NOT EXISTS idx_srs_cards_user_due ON srs_cards(user_id, due_at);
  `
  const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: { message: 'rpc not available' } }))
  if (error) {
    console.log('Run this SQL in your Supabase dashboard → SQL Editor:\n')
    console.log(sql)
  } else {
    console.log('srs_cards table created successfully.')
  }
}

main()
