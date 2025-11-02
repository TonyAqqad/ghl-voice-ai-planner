/**
 * Spec Linter: Validates PromptSpec for common issues and violations
 */

import type { PromptSpec } from './specTypes';

export interface SpecLintIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'field_order' | 'disallowed_phrases' | 'config' | 'completeness';
  message: string;
  fix?: string;
}

/**
 * Lints a PromptSpec and returns list of issues
 */
export function lintSpec(spec: PromptSpec, promptText?: string): SpecLintIssue[] {
  const issues: SpecLintIssue[] = [];

  // 1. Check required_fields is not empty
  if (!spec.required_fields || spec.required_fields.length === 0) {
    issues.push({
      severity: 'error',
      category: 'completeness',
      message: 'No required fields defined - agent won\'t know what to collect',
      fix: 'Add required_fields: [\'first_name\', \'last_name\', \'unique_phone_number\', \'email\', \'class_date__time\']',
    });
  }

  // 2. Check field_order matches required_fields
  if (spec.field_order.length !== spec.required_fields.length) {
    issues.push({
      severity: 'warning',
      category: 'field_order',
      message: `field_order (${spec.field_order.length} fields) doesn't match required_fields (${spec.required_fields.length} fields)`,
      fix: 'Ensure field_order includes all required_fields in the correct sequence',
    });
  }

  // 3. Check for required fields NOT in field_order
  const missingFromOrder = spec.required_fields.filter(f => !spec.field_order.includes(f));
  if (missingFromOrder.length > 0) {
    issues.push({
      severity: 'error',
      category: 'field_order',
      message: `Required fields missing from field_order: ${missingFromOrder.join(', ')}`,
      fix: `Add these fields to field_order: ${missingFromOrder.join(', ')}`,
    });
  }

  // 4. Check max_words_per_turn is reasonable
  if (spec.max_words_per_turn > 30) {
    issues.push({
      severity: 'warning',
      category: 'config',
      message: `max_words_per_turn (${spec.max_words_per_turn}) is very high - responses may be too long`,
      fix: 'Consider reducing to 15-25 words for concise phone responses',
    });
  }

  if (spec.max_words_per_turn < 10) {
    issues.push({
      severity: 'warning',
      category: 'config',
      message: `max_words_per_turn (${spec.max_words_per_turn}) is very low - agent may sound robotic`,
      fix: 'Consider increasing to 15-25 words for natural conversation',
    });
  }

  // 5. Check disallowed_phrases for common problematic words
  const commonProblematicPhrases = ['additionally', 'furthermore', 'moreover', 'also', 'please provide'];
  const missingDisallowed = commonProblematicPhrases.filter(phrase => 
    !spec.disallowed_phrases.some(dp => dp.toLowerCase().includes(phrase.toLowerCase()))
  );

  if (missingDisallowed.length > 0) {
    issues.push({
      severity: 'info',
      category: 'disallowed_phrases',
      message: `Consider blocking these verbose words: ${missingDisallowed.join(', ')}`,
      fix: `Add to disallowed_phrases: ${JSON.stringify(missingDisallowed)}`,
    });
  }

  const duplicateDisallowed = spec.disallowed_phrases.filter((phrase, idx, arr) =>
    arr.findIndex(item => item.toLowerCase() === phrase.toLowerCase()) !== idx
  );

  if (duplicateDisallowed.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'disallowed_phrases',
      message: `Duplicate disallowed phrases detected: ${[...new Set(duplicateDisallowed)].join(', ')}`,
      fix: 'Remove duplicates so enforcement stays predictable',
    });
  }

  if (promptText && spec.disallowed_phrases.length > 0) {
    const promptLower = promptText.toLowerCase();
    const triggered = spec.disallowed_phrases.filter((phrase) =>
      phrase && promptLower.includes(phrase.toLowerCase())
    );

    if (triggered.length > 0) {
      issues.push({
        severity: 'error',
        category: 'disallowed_phrases',
        message: `Prompt still contains disallowed phrase${triggered.length > 1 ? 's' : ''}: ${triggered.join(', ')}`,
        fix: 'Remove the phrases from the prompt or adjust disallowed_phrases if intentional',
      });
    }
  }

  // 6. Check question_cadence
  if (spec.question_cadence !== 'one_at_a_time') {
    issues.push({
      severity: 'warning',
      category: 'config',
      message: `question_cadence is "${spec.question_cadence}" - should be "one_at_a_time" for voice calls`,
      fix: 'Set question_cadence: "one_at_a_time"',
    });
  }

  // 7. Check block_booking_until_fields
  if (!spec.block_booking_until_fields) {
    issues.push({
      severity: 'info',
      category: 'config',
      message: 'block_booking_until_fields is false - agent can book before collecting all info',
      fix: 'Consider setting block_booking_until_fields: true to ensure all fields are collected first',
    });
  }

  // 8. Check confirmations
  if (!spec.confirmations.repeat_phone && !spec.confirmations.spell_email) {
    issues.push({
      severity: 'warning',
      category: 'config',
      message: 'No confirmation rules enabled - risk of incorrect data capture',
      fix: 'Enable at least one confirmation: repeat_phone or spell_email',
    });
  }

  // 9. Check agent_values
  if (!spec.agent_values || spec.agent_values.length === 0) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      message: 'No agent_values defined - agent won\'t have context to answer questions',
      fix: 'Add agent_values: [\'class_times\', \'location_hours\', \'trial_offer\', \'what_to_bring\']',
    });
  }

  return issues;
}

/**
 * Detects if prompt has drifted from saved spec
 */
export function detectSpecDrift(
  currentPromptHash: string,
  savedPromptHash: string | null
): {
  hasDrift: boolean;
  message?: string;
} {
  if (!savedPromptHash) {
    return {
      hasDrift: false,
      message: 'No saved spec to compare against',
    };
  }

  if (currentPromptHash !== savedPromptHash) {
    return {
      hasDrift: true,
      message: 'Prompt has changed since last save - click "Save Prompt" to update spec',
    };
  }

  return {
    hasDrift: false,
  };
}

/**
 * Formats lint issues for display
 */
export function formatLintIssues(issues: SpecLintIssue[]): string {
  if (issues.length === 0) return '✅ No issues found';

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  let output = '';
  
  if (errors.length > 0) {
    output += `❌ ${errors.length} Error${errors.length !== 1 ? 's' : ''}:\n`;
    errors.forEach(e => output += `  • ${e.message}\n`);
  }
  
  if (warnings.length > 0) {
    output += `⚠️ ${warnings.length} Warning${warnings.length !== 1 ? 's' : ''}:\n`;
    warnings.forEach(w => output += `  • ${w.message}\n`);
  }
  
  if (infos.length > 0) {
    output += `ℹ️ ${infos.length} Suggestion${infos.length !== 1 ? 's' : ''}:\n`;
    infos.forEach(i => output += `  • ${i.message}\n`);
  }

  return output.trim();
}

