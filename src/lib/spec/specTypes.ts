/**
 * Prompt Specification Types
 * 
 * Defines the structure of the embedded SPEC JSON in system prompts.
 * The spec drives dynamic grading and ensures agent behavior matches prompt rules.
 */

export type PromptSpec = {
  agent_type: 'voice_ai';
  niche: 'fitness_gym' | 'martial_arts' | 'roofing' | 'medspa' | 'dental' | 'legal' | 'solar' | 'plumbing' | 'real_estate' | 'saas_onboarding' | string;
  required_fields: ['first_name', 'last_name', 'unique_phone_number', 'email', 'class_date__time'];
  field_order: ['first_name', 'last_name', 'unique_phone_number', 'email', 'class_date__time'];
  block_booking_until_fields: boolean;
  disallowed_phrases: string[];      // e.g. ["let me book you","i'll get you scheduled"]
  question_cadence: 'one_at_a_time';
  max_words_per_turn: number;        // default 30
  confirmations: { 
    repeat_phone: boolean; 
    spell_email: boolean; 
  };
  agent_values: ['class_times', 'location_hours', 'trial_offer', 'what_to_bring'];
};

/**
 * Default F45 Training spec
 * Used as fallback when no spec is embedded in the prompt
 */
export const DEFAULT_SPEC: PromptSpec = {
  agent_type: 'voice_ai',
  niche: 'fitness_gym',
  required_fields: ['first_name', 'last_name', 'unique_phone_number', 'email', 'class_date__time'],
  field_order: ['first_name', 'last_name', 'unique_phone_number', 'email', 'class_date__time'],
  block_booking_until_fields: true,
  disallowed_phrases: [
    'let me book you',
    "i'll book you",
    "i'll get you scheduled",
    'booking you for',
    'scheduling you for',
    'you are booked',
    'you are scheduled',
    "i've booked you",
    "i've scheduled you"
  ],
  question_cadence: 'one_at_a_time',
  max_words_per_turn: 30,
  confirmations: {
    repeat_phone: true,
    spell_email: true
  },
  agent_values: ['class_times', 'location_hours', 'trial_offer', 'what_to_bring']
};

