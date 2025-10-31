-- ============================================
-- CUSTOM ACTION TRACKING MIGRATION
-- Tracks when AI triggers custom actions
-- ============================================

-- Create agent_action_triggers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'agent_action_triggers'
  ) THEN
    CREATE TABLE agent_action_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id TEXT NOT NULL,
      call_log_id UUID REFERENCES agent_call_logs(id) ON DELETE CASCADE,
      action_name TEXT NOT NULL,
      action_type TEXT, -- 'ghl_upsert_contact', 'schedule_appointment', 'trigger_workflow', etc.
      trigger_time TIMESTAMPTZ DEFAULT now(),
      conversation_turn INTEGER, -- Which turn in the conversation was this triggered?
      parameters JSONB, -- Action parameters
      result JSONB, -- Action result/response
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      expected_turn INTEGER, -- When SHOULD it have been triggered (from rubric)
      was_timely BOOLEAN, -- Did it trigger at the right time?
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_triggers_call_log ON agent_action_triggers(call_log_id);
CREATE INDEX IF NOT EXISTS idx_action_triggers_agent ON agent_action_triggers(agent_id);
CREATE INDEX IF NOT EXISTS idx_action_triggers_action_name ON agent_action_triggers(action_name);
CREATE INDEX IF NOT EXISTS idx_action_triggers_created_at ON agent_action_triggers(created_at);

-- Enable RLS
ALTER TABLE agent_action_triggers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_action_triggers;
CREATE POLICY "Enable all for service role" ON agent_action_triggers FOR ALL USING (true);

-- Add action_triggers to evaluation data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'action_triggers'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN action_triggers JSONB;
  END IF;
END $$;

-- SUCCESS!
-- Run queries to verify:
SELECT * FROM agent_action_triggers LIMIT 5;
SELECT column_name FROM information_schema.columns WHERE table_name = 'agent_action_triggers';

