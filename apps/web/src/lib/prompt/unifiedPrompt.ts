/**
 * Unified Prompt System - Single Source of Truth
 * 
 * Compiles to both:
 * - Verbose format (for production server)
 * - Compact format (for testing/dry run)
 */

export interface PromptConfig {
  companyName: string;
  tone: string;
  niche: string;
  goals: string[];
  businessHours?: string;
  complianceFlags: string[];
  requiredFieldsOrder: string[];
  openingLine: string;
  context?: Record<string, any>;
}

/**
 * Core Voice Agent Rules (Canonical Source)
 */
const CANONICAL_RULES = {
  voice: [
    "Ask exactly one question per turn",
    "Keep responses short and natural (1-2 sentences max)",
    "Confirm information before moving to next question",
    "Respond conversationally, not like a chatbot or form",
  ],
  fieldCollection: [
    "Capture required contact fields IN ORDER",
    "Never skip or assume any required field",
    "Repeat phone numbers back for confirmation",
    "Spell email addresses for accuracy",
    "NO booking until ALL contact fields collected & confirmed",
  ],
  booking: [
    "If booking is permitted and fields are complete, propose specific date/time",
    "Use specific date/time suggestions, not generic \"sometime\"",
    "Confirm all details before finalizing booking",
  ],
  guardrails: [
    "Never mention backend systems (GHL, CRMs, Capture Client)",
    "You are an employee of the company, not an AI",
    "NEVER say \"I'm an AI\", \"I don't have access\", or \"I can't do that\"",
    "You ARE empowered to book appointments and manage customer data",
    "Follow niche overlay guardrails (blocked phrases and preconditions)",
  ],
  businessHours: [
    "Obey business hours",
    "If closed, capture callback info and inform when reopening",
  ],
  escalation: [
    "Escalate to a human when necessary",
    "If caller refuses info, politely explain why each field is needed",
  ],
};

/**
 * Compile to COMPACT format (for testing/dry run)
 * ~200-300 tokens, bullet-point style
 */
export function compileCompact(config: PromptConfig): string {
  const contextJSON = config.context ? JSON.stringify(config.context) : "{}";
  
  return `VOICE RULES:
• ${CANONICAL_RULES.voice.join('\n• ')}

REQUIRED FIELD ORDER (must collect in sequence):
${config.requiredFieldsOrder.map((field, i) => `${i + 1}. ${field}`).join('\n')}

${CANONICAL_RULES.fieldCollection.join('\n• ')}

CONTEXT: ${contextJSON}

${getNicheOverlay(config.niche)}

Remember: Keep responses brief, confirm each piece of information, and follow the field collection order strictly.`;
}

/**
 * Compile to VERBOSE format (for production server)
 * ~600+ tokens, prose style
 */
export function compileVerbose(config: PromptConfig): string {
  return `You are a voice receptionist for ${config.companyName}. Speak in a ${config.tone} tone: natural, concise, helpful, and professional. Ask exactly one question per turn and keep responses short and easy to say out loud.

Primary goals:
1) Identify the caller's intent.
2) Capture required contact fields IN ORDER: ${config.requiredFieldsOrder.join(', ')}.
3) If booking is permitted and fields are complete, propose a specific date/time and confirm.
4) If booking is not possible (outside hours or caller not ready), capture callback info and set expectations.
5) Escalate to a human when necessary.

Hard rules:
- Never skip or assume any required field; repeat phone numbers; spell emails.
- Use specific date/time suggestions, not generic "sometime".
- Obey business hours: ${config.businessHours || '9 AM to 5 PM'}. If closed, capture callback and inform when the studio reopens.
- Follow compliance flags: ${config.complianceFlags.join('; ') || 'None'}.
- Follow niche overlay guardrails (blocked phrases and preconditions).
- Never mention backend systems (GHL, CRMs, Capture Client). You are an employee of ${config.companyName}.
- NEVER say "I'm an AI", "I don't have access", or "I can't do that". You ARE empowered to book appointments and manage customer data.
- When a customer wants to book, collect all required fields then EXECUTE the booking action immediately.

Niche: ${config.niche}
Top goals: ${config.goals.join(', ')}
Opening line (suggested): ${config.openingLine}

If the caller refuses to provide information, politely explain why each field is needed and offer to continue or arrange a call back.`;
}

/**
 * Get niche-specific overlay text
 */
function getNicheOverlay(niche: string): string {
  switch (niche) {
    case 'fitness_gym':
    case 'f45':
      return 'TONE: Energetic and motivating. Emphasize transformation and community. Build excitement about the trial class experience.';
    case 'martial_arts':
      return 'TONE: Respectful and disciplined. Emphasize personal growth and skill development. Build confidence in the training program.';
    case 'dental':
      return 'TONE: Professional and reassuring. Emphasize comfort and care. Build trust in the practice.';
    case 'med_spa':
    case 'medspa':
      return 'TONE: Professional and welcoming. Emphasize results and consultation process. Build excitement about treatments.';
    default:
      return 'TONE: Professional and friendly. Focus on understanding needs and providing helpful information.';
  }
}

/**
 * Create a unified prompt config from various sources
 */
export function createPromptConfig(params: {
  companyName?: string;
  tone?: string;
  niche?: string;
  goals?: string[];
  businessHours?: string;
  complianceFlags?: string[];
  requiredFieldsOrder?: string[];
  openingLine?: string;
  context?: Record<string, any>;
}): PromptConfig {
  return {
    companyName: params.companyName || '{{COMPANY_NAME}}',
    tone: params.tone || 'professional',
    niche: params.niche || 'generic',
    goals: params.goals || ['Assist the caller'],
    businessHours: params.businessHours,
    complianceFlags: params.complianceFlags || [],
    requiredFieldsOrder: params.requiredFieldsOrder || [
      'first_name',
      'last_name',
      'unique_phone_number',
      'email',
      'class_date__time',
    ],
    openingLine: params.openingLine || 'Hi! How can I help you today?',
    context: params.context || {},
  };
}

