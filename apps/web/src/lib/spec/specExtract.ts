/**
 * Prompt Spec Extraction
 * 
 * Extracts embedded SPEC JSON from system prompts between markers:
 * <!-- SPEC_JSON_START --> {...} <!-- SPEC_JSON_END -->
 */

import { PromptSpec, DEFAULT_SPEC } from './specTypes';

const SPEC_START_MARKER = '<!-- SPEC_JSON_START -->';
const SPEC_END_MARKER = '<!-- SPEC_JSON_END -->';

/**
 * Extract spec from system prompt
 * Returns the embedded spec if found, otherwise returns DEFAULT_SPEC
 */
export function extractSpecFromPrompt(prompt: string): PromptSpec {
  if (!prompt || typeof prompt !== 'string') {
    console.warn('⚠️ No prompt provided, using DEFAULT_SPEC');
    return DEFAULT_SPEC;
  }

  const startIndex = prompt.indexOf(SPEC_START_MARKER);
  const endIndex = prompt.indexOf(SPEC_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    console.log('ℹ️ No spec markers found in prompt, using DEFAULT_SPEC');
    return DEFAULT_SPEC;
  }

  const jsonStart = startIndex + SPEC_START_MARKER.length;
  const jsonString = prompt.substring(jsonStart, endIndex).trim();

  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate required fields
    if (!parsed.agent_type || !parsed.required_fields || !parsed.field_order) {
      console.warn('⚠️ Incomplete spec found, using DEFAULT_SPEC');
      return DEFAULT_SPEC;
    }

    console.log('✅ Spec extracted from prompt:', parsed.niche);
    return parsed as PromptSpec;
  } catch (error) {
    console.error('❌ Failed to parse spec JSON from prompt:', error);
    return DEFAULT_SPEC;
  }
}

/**
 * Embed spec into system prompt
 * Adds or replaces the spec markers in the prompt
 */
export function embedSpecInPrompt(prompt: string, spec: PromptSpec): string {
  const specJson = JSON.stringify(spec, null, 2);
  const embeddedSpec = `\n${SPEC_START_MARKER}\n${specJson}\n${SPEC_END_MARKER}\n`;

  // Check if spec already exists
  const startIndex = prompt.indexOf(SPEC_START_MARKER);
  const endIndex = prompt.indexOf(SPEC_END_MARKER);

  if (startIndex !== -1 && endIndex !== -1) {
    // Replace existing spec
    const before = prompt.substring(0, startIndex);
    const after = prompt.substring(endIndex + SPEC_END_MARKER.length);
    return before + embeddedSpec + after;
  }

  // Append spec at the end
  return prompt + embeddedSpec;
}

/**
 * Check if prompt contains a spec
 */
export function hasEmbeddedSpec(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  return prompt.includes(SPEC_START_MARKER) && prompt.includes(SPEC_END_MARKER);
}

