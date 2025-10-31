-- ============================================
-- SUPABASE MIGRATION SCRIPT
-- Autonomous Voice AI Evaluation System
-- ============================================
-- Run this in Supabase SQL Editor to add missing columns
-- Safe to run multiple times (idempotent)

-- ============================================
-- 1. Add missing columns to agent_call_logs
-- ============================================

-- Add prompt_id (foreign key to agent_prompts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_call_logs' AND column_name = 'prompt_id'
  ) THEN
    ALTER TABLE agent_call_logs ADD COLUMN prompt_id UUID REFERENCES agent_prompts(id);
  END IF;
END $$;

-- Make transcript NOT NULL (add default first if needed)
DO $$ 
BEGIN
  -- First, update any NULL values to empty string
  UPDATE agent_call_logs SET transcript = '' WHERE transcript IS NULL;
  
  -- Then set NOT NULL constraint
  ALTER TABLE agent_call_logs ALTER COLUMN transcript SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column might already be NOT NULL, ignore error
    NULL;
END $$;

-- Add reviewed_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_call_logs' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE agent_call_logs ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add review_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_call_logs' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE agent_call_logs ADD COLUMN review_id UUID;
  END IF;
END $$;

-- ============================================
-- 2. Add missing columns to agent_prompt_reviews
-- ============================================

-- Add call_log_id (foreign key)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'call_log_id'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN call_log_id UUID REFERENCES agent_call_logs(id);
  END IF;
END $$;

-- Add confidence_score
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN confidence_score DECIMAL(3,2);
  END IF;
END $$;

-- Make evaluation NOT NULL (add default first if needed)
DO $$ 
BEGIN
  -- First, update any NULL values to empty object
  UPDATE agent_prompt_reviews SET evaluation = '{}' WHERE evaluation IS NULL;
  
  -- Then set NOT NULL constraint
  ALTER TABLE agent_prompt_reviews ALTER COLUMN evaluation SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column might already be NOT NULL, ignore error
    NULL;
END $$;

-- Add patch_applied
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'patch_applied'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN patch_applied BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add applied_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN applied_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 3. Add missing columns to agent_prompts
-- ============================================

-- Add prompt_hash (for version control)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompts' AND column_name = 'prompt_hash'
  ) THEN
    ALTER TABLE agent_prompts ADD COLUMN prompt_hash TEXT;
  END IF;
END $$;

-- ============================================
-- 4. Create missing indexes
-- ============================================

-- agent_call_logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON agent_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_reviewed_at ON agent_call_logs(reviewed_at);

-- agent_prompt_reviews indexes
CREATE INDEX IF NOT EXISTS idx_prompt_reviews_agent_id ON agent_prompt_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_reviews_patch_applied ON agent_prompt_reviews(patch_applied);

-- agent_prompts indexes
CREATE INDEX IF NOT EXISTS idx_agent_prompts_niche ON agent_prompts(niche);
CREATE INDEX IF NOT EXISTS idx_prompt_kits_name ON prompt_kits(name);

-- ============================================
-- 5. Create manual response correction table
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'agent_response_corrections'
  ) THEN
    CREATE TABLE agent_response_corrections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id TEXT NOT NULL,
      call_log_id UUID REFERENCES agent_call_logs(id),
      prompt_id UUID REFERENCES agent_prompts(id),
      review_id UUID REFERENCES agent_prompt_reviews(id),
      original_response TEXT NOT NULL,
      original_hash TEXT,
      corrected_response TEXT NOT NULL,
      corrected_hash TEXT,
      store_in TEXT NOT NULL CHECK (store_in IN ('prompt', 'kb')),
      reason TEXT,
      confirmation_message TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_response_corrections_agent_id ON agent_response_corrections(agent_id);
CREATE INDEX IF NOT EXISTS idx_response_corrections_created_at ON agent_response_corrections(created_at);

-- ============================================
-- 6. Enable RLS and create policies
-- ============================================

-- Enable RLS on prompt_kits
ALTER TABLE prompt_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON prompt_kits;
CREATE POLICY "Enable all for service role" ON prompt_kits FOR ALL USING (true);

-- Enable RLS on prompt_kits_niche_overlays
ALTER TABLE prompt_kits_niche_overlays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON prompt_kits_niche_overlays;
CREATE POLICY "Enable all for service role" ON prompt_kits_niche_overlays FOR ALL USING (true);

-- Enable RLS on agent_prompts
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_prompts;
CREATE POLICY "Enable all for service role" ON agent_prompts FOR ALL USING (true);

-- Enable RLS on agent_call_logs
ALTER TABLE agent_call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_call_logs;
CREATE POLICY "Enable all for service role" ON agent_call_logs FOR ALL USING (true);

-- Enable RLS on agent_prompt_reviews
ALTER TABLE agent_prompt_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_prompt_reviews;
CREATE POLICY "Enable all for service role" ON agent_prompt_reviews FOR ALL USING (true);

-- Enable RLS on agent_response_corrections
ALTER TABLE agent_response_corrections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_response_corrections;
CREATE POLICY "Enable all for service role" ON agent_response_corrections FOR ALL USING (true);

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify:

-- Check agent_call_logs columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agent_call_logs' 
ORDER BY ordinal_position;

-- Check agent_prompt_reviews columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agent_prompt_reviews' 
ORDER BY ordinal_position;

-- Check agent_prompts has prompt_hash
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agent_prompts' AND column_name = 'prompt_hash';

-- Check agent_response_corrections columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'agent_response_corrections'
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS!
-- ============================================
-- If no errors, your Supabase database is now ready
-- for the autonomous evaluation system.

