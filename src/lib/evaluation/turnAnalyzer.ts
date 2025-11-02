/**
 * Turn Analyzer - Client-Side Analysis Logic
 * 
 * Analyzes each conversation turn in real-time to provide
 * Master AI insights and feedback
 */

import { PromptSpec } from '../spec/specTypes';

export interface TurnAnalysis {
  compliance: {
    score: number; // 0-1
    violations: string[];
    passed: string[];
  };
  fieldProgress: {
    collected: string[];
    remaining: string[];
    currentStep: number;
    totalSteps: number;
  };
  intentMatch: {
    matched: boolean;
    detected: string;
    confidence: number;
  };
  redFlags: string[];
  suggestions: string[];
  wouldHaveSaid?: string;
  tone: {
    appropriate: boolean;
    detected: string;
  };
}

export interface ConversationContext {
  agentId: string;
  conversation: Array<{ role: string; text: string }>;
  lastAgentResponse: string;
  promptSpec?: PromptSpec | null;
  systemPrompt: string;
  niche?: string;
}

/**
 * Analyze a single turn locally (basic analysis)
 * For deep analysis, use the API endpoint
 */
export function analyzeTurnLocally(context: ConversationContext): TurnAnalysis {
  const { lastAgentResponse, conversation, promptSpec } = context;
  
  // Basic local analysis (fast, no API call)
  const violations: string[] = [];
  const passed: string[] = [];
  const redFlags: string[] = [];
  const suggestions: string[] = [];
  
  // Check: One question per turn
  const questionCount = (lastAgentResponse.match(/\?/g) || []).length;
  if (questionCount === 1) {
    passed.push('Asked one question per turn');
  } else if (questionCount > 1) {
    violations.push('Asked multiple questions in one turn');
    redFlags.push('🚫 Multiple questions detected');
  } else if (questionCount === 0) {
    // Might be a statement or confirmation
    passed.push('Made a statement (no question)');
  }
  
  // Check: Response length
  const sentenceCount = lastAgentResponse.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  if (sentenceCount <= 2) {
    passed.push('Kept response concise (1-2 sentences)');
  } else {
    violations.push('Response too long (>2 sentences)');
    suggestions.push('💡 Try to keep responses shorter');
  }
  
  // Check: Word count
  const wordCount = lastAgentResponse.split(/\s+/).length;
  if (wordCount > 50) {
    violations.push('Response over 50 words');
    redFlags.push('⚠️ Very long response for voice');
  }
  
  // Check for AI self-reference
  const aiPhrases = /\b(i'm an ai|i don't have access|i can't do that|i'm not able|as an ai)\b/i;
  if (aiPhrases.test(lastAgentResponse)) {
    violations.push('AI self-reference detected');
    redFlags.push('🚫 CRITICAL: AI exposed itself');
  }
  
  // Check for backend mentions
  const backendPhrases = /\b(ghl|highlevel|crm|capture client|backend|system)\b/i;
  if (backendPhrases.test(lastAgentResponse)) {
    violations.push('Backend system mentioned');
    redFlags.push('🚫 Mentioned backend systems');
  }
  
  // Detect field collection attempts
  const fieldPatterns = {
    first_name: /\b(first name|what('s| is) your name|can i (get|have) your name)\b/i,
    last_name: /\b(last name|surname|family name)\b/i,
    phone: /\b(phone|number|contact number|best number)\b/i,
    email: /\b(email|e-mail|email address)\b/i,
    date: /\b(date|time|when|schedule|book|appointment)\b/i,
  };
  
  const detectedFields: string[] = [];
  Object.entries(fieldPatterns).forEach(([field, pattern]) => {
    if (pattern.test(lastAgentResponse)) {
      detectedFields.push(field);
    }
  });
  
  // Calculate compliance score
  const totalChecks = passed.length + violations.length;
  const complianceScore = totalChecks > 0 ? passed.length / totalChecks : 1;
  
  // Intent detection (simple)
  const hasGreeting = /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(lastAgentResponse);
  const hasQuestion = questionCount > 0;
  const hasConfirmation = /\b(great|perfect|sounds good|got it)\b/i.test(lastAgentResponse);
  
  let detectedIntent = 'unknown';
  if (hasGreeting) detectedIntent = 'greeting';
  else if (hasConfirmation) detectedIntent = 'confirmation';
  else if (hasQuestion) detectedIntent = 'information_gathering';
  
  return {
    compliance: {
      score: complianceScore,
      violations,
      passed,
    },
    fieldProgress: {
      collected: detectedFields,
      remaining: ['first_name', 'last_name', 'phone', 'email', 'date'].filter(
        f => !detectedFields.includes(f)
      ),
      currentStep: detectedFields.length,
      totalSteps: 5,
    },
    intentMatch: {
      matched: detectedIntent !== 'unknown',
      detected: detectedIntent,
      confidence: hasGreeting || hasQuestion || hasConfirmation ? 0.8 : 0.3,
    },
    redFlags,
    suggestions,
    tone: {
      appropriate: !violations.some(v => v.includes('AI') || v.includes('backend')),
      detected: 'professional',
    },
  };
}

/**
 * Call the server API for deep turn analysis
 */
export async function analyzeTurnWithAPI(context: ConversationContext): Promise<TurnAnalysis> {
  try {
    const response = await fetch('/api/mcp/master/analyzeTurn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context),
    });
    
    if (!response.ok) {
      console.warn('Turn analysis API failed, falling back to local analysis');
      return analyzeTurnLocally(context);
    }
    
    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.warn('Turn analysis API error, falling back to local:', error);
    return analyzeTurnLocally(context);
  }
}

/**
 * Get a summary string for the analysis
 */
export function getAnalysisSummary(analysis: TurnAnalysis): string {
  const { compliance, fieldProgress, redFlags } = analysis;
  
  const parts: string[] = [];
  
  if (compliance.score >= 0.9) {
    parts.push('✅ Excellent compliance');
  } else if (compliance.score >= 0.7) {
    parts.push('⚠️ Good, minor issues');
  } else {
    parts.push('❌ Needs improvement');
  }
  
  if (fieldProgress.collected.length > 0) {
    parts.push(`📊 ${fieldProgress.currentStep}/${fieldProgress.totalSteps} fields`);
  }
  
  if (redFlags.length > 0) {
    parts.push(`🚫 ${redFlags.length} red flag${redFlags.length > 1 ? 's' : ''}`);
  }
  
  return parts.join(' • ');
}

