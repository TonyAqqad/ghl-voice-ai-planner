-- Seed a test F45 Voice AI agent for dry-run testing
-- Run this in Supabase SQL Editor

-- Insert test agent if it doesn't exist
INSERT INTO agents (agent_id, name, description, system_prompt, voice_id, config)
VALUES (
  '1',
  'F45 Test Agent',
  'Test agent for F45 Training prompt composition and dry-run testing',
  'You are a voice receptionist for F45 Training. You help callers book trial classes and answer questions about F45 fitness programs.',
  'default',
  '{
    "niche": "fitness_gym",
    "tone": "professional",
    "businessHours": {
      "open": "6 AM",
      "close": "8 PM"
    }
  }'::jsonb
)
ON CONFLICT (agent_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt,
  voice_id = EXCLUDED.voice_id,
  config = EXCLUDED.config,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the agent was created
SELECT agent_id, name, description FROM agents WHERE agent_id = '1';

