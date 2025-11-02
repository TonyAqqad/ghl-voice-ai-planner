/**
 * Strict Minimal Field Set for 3-Layer Architecture
 * Enforces only these fields - no additional custom fields allowed
 */

// Contact fields that MUST be collected before booking
export const CONTACT_KEYS = [
  'first_name',
  'last_name',
  'unique_phone_number',
  'email',
  'class_date__time'
] as const;

// Agent-specific custom values (for context injection)
export const CUSTOM_VALUE_KEYS = [
  'class_times',
  'location_hours',
  'trial_offer',
  'what_to_bring'
] as const;

// Business context fields
export const BUSINESS_KEYS = [
  'name',
  'address',
  'state',
  'city'
] as const;

// Type exports
export type ContactKey = typeof CONTACT_KEYS[number];
export type CustomValueKey = typeof CUSTOM_VALUE_KEYS[number];
export type BusinessKey = typeof BUSINESS_KEYS[number];

// Minimal context structure for prompt composition
export interface MinimalContext {
  biz: Record<BusinessKey, string>;
  agent: Record<CustomValueKey, string>;
}

// Helper to validate context completeness
export function validateMinimalContext(context: Partial<MinimalContext>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  if (!context.biz) {
    missing.push('biz');
  } else {
    BUSINESS_KEYS.forEach(key => {
      if (!context.biz![key] || context.biz![key].trim() === '') {
        missing.push(`biz.${key}`);
      }
    });
  }
  
  if (!context.agent) {
    missing.push('agent');
  } else {
    CUSTOM_VALUE_KEYS.forEach(key => {
      if (!context.agent![key] || context.agent![key].trim() === '') {
        missing.push(`agent.${key}`);
      }
    });
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Helper to truncate long values for compact JSON context
export function truncateContextValues(context: MinimalContext, maxLength = 120): MinimalContext {
  const truncate = (str: string) => str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  
  return {
    biz: Object.fromEntries(
      Object.entries(context.biz).map(([k, v]) => [k, truncate(v)])
    ) as Record<BusinessKey, string>,
    agent: Object.fromEntries(
      Object.entries(context.agent).map(([k, v]) => [k, truncate(v)])
    ) as Record<CustomValueKey, string>
  };
}

