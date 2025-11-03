/**
 * A/B Testing Framework - Prove training works
 * 
 * SOLID Principles:
 * - Single Responsibility: Compare attestations with/without snippets
 * - Open/Closed: Extensible for different comparison strategies
 * 
 * Purpose: Run ablation tests to prove snippets improve performance
 */

import {
  TurnAttestation,
  AttestationComparison,
} from './attestationTypes';
import {
  compileRuntimeContext,
  RuntimeContextRequest,
  CompiledRuntimeContext,
} from '../prompt/masterOrchestrator';
import { attestationStore } from './attestationStore';
import { SessionEvaluation } from '../evaluation/types';
import { evaluateSession } from '../evaluation/sessionEvaluator';

/**
 * A/B Test configuration
 */
export interface ABTestConfig {
  /** Base request configuration */
  request: RuntimeContextRequest;
  /** Function to call the model with messages */
  modelCall: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  /** Function to evaluate the response */
  evaluateResponse?: (response: string) => number; // Score 0-100
}

/**
 * A/B Test result
 */
export interface ABTestResult {
  /** Attestation with snippets enabled */
  withSnippets: {
    attestation: TurnAttestation;
    response: string;
    score: number;
  };
  /** Attestation with snippets disabled */
  withoutSnippets: {
    attestation: TurnAttestation;
    response: string;
    score: number;
  };
  /** Comparison summary */
  comparison: AttestationComparison;
  /** Performance delta (positive = snippets improved) */
  scoreDelta: number;
  /** Token delta (positive = snippets added tokens) */
  tokenDelta: number;
  /** Did snippets improve performance? */
  improved: boolean;
  /** Test timestamp */
  timestamp: number;
}

/**
 * Run A/B test: Compare with and without snippets
 * 
 * This is the PROOF that training works:
 * - Run same request twice (with/without snippets)
 * - Compare responses and scores
 * - If snippets improve score, training is working
 * - If not, diagnostics show why (token budget, injection order, etc.)
 */
export async function runABTest(config: ABTestConfig): Promise<ABTestResult> {
  console.log('🧪 Starting A/B test...');
  
  const timestamp = Date.now();
  
  // Test A: WITH SNIPPETS
  console.log('🅰️  Running Test A (with snippets)...');
  const requestWithSnippets: RuntimeContextRequest = {
    ...config.request,
    snippetsEnabled: true,
    turnId: `${config.request.turnId}-with-snippets`,
  };
  
  const compiledWithSnippets = await compileRuntimeContext(requestWithSnippets);
  const responseWithSnippets = await config.modelCall(compiledWithSnippets.messages);
  const scoreWithSnippets = config.evaluateResponse
    ? config.evaluateResponse(responseWithSnippets)
    : 50; // Default neutral score
  
  console.log(`   Response: ${responseWithSnippets.substring(0, 100)}...`);
  console.log(`   Score: ${scoreWithSnippets}`);
  console.log(`   Snippets applied: ${compiledWithSnippets.attestation.snippetsApplied.length}`);
  
  // Test B: WITHOUT SNIPPETS
  console.log('🅱️  Running Test B (without snippets)...');
  const requestWithoutSnippets: RuntimeContextRequest = {
    ...config.request,
    snippetsEnabled: false,
    turnId: `${config.request.turnId}-without-snippets`,
  };
  
  const compiledWithoutSnippets = await compileRuntimeContext(requestWithoutSnippets);
  const responseWithoutSnippets = await config.modelCall(compiledWithoutSnippets.messages);
  const scoreWithoutSnippets = config.evaluateResponse
    ? config.evaluateResponse(responseWithoutSnippets)
    : 50;
  
  console.log(`   Response: ${responseWithoutSnippets.substring(0, 100)}...`);
  console.log(`   Score: ${scoreWithoutSnippets}`);
  console.log(`   Snippets applied: ${compiledWithoutSnippets.attestation.snippetsApplied.length}`);
  
  // Calculate deltas
  const scoreDelta = scoreWithSnippets - scoreWithoutSnippets;
  const tokenDelta =
    compiledWithSnippets.attestation.tokenBudget.total -
    compiledWithoutSnippets.attestation.tokenBudget.total;
  
  const improved = scoreDelta > 0;
  
  // Create comparison
  const comparison: AttestationComparison = {
    withSnippets: compiledWithSnippets.attestation,
    withoutSnippets: compiledWithoutSnippets.attestation,
    differences: {
      snippetCount: compiledWithSnippets.attestation.snippetsApplied.length,
      tokenDelta,
      diagnosticDelta:
        compiledWithSnippets.attestation.diagnostics.length -
        compiledWithoutSnippets.attestation.diagnostics.length,
    },
    comparedAt: timestamp,
  };
  
  // Store comparison for later analysis
  attestationStore.saveComparison(comparison);
  
  // Log result
  console.log('🎯 A/B Test Result:');
  console.log(`   Score Delta: ${scoreDelta > 0 ? '+' : ''}${scoreDelta}`);
  console.log(`   Token Delta: ${tokenDelta > 0 ? '+' : ''}${tokenDelta}`);
  console.log(`   Improved: ${improved ? '✅ YES' : '❌ NO'}`);
  
  if (!improved) {
    console.log('⚠️  WARNING: Snippets did not improve performance!');
    console.log('   Possible reasons:');
    console.log('   - Snippets are not relevant to this query');
    console.log('   - Token budget exceeded (snippets truncated)');
    console.log('   - Snippets injected after dialogue (wrong order)');
    console.log('   - SPEC mismatch between runtime and grader');
  }
  
  return {
    withSnippets: {
      attestation: compiledWithSnippets.attestation,
      response: responseWithSnippets,
      score: scoreWithSnippets,
    },
    withoutSnippets: {
      attestation: compiledWithoutSnippets.attestation,
      response: responseWithoutSnippets,
      score: scoreWithoutSnippets,
    },
    comparison,
    scoreDelta,
    tokenDelta,
    improved,
    timestamp,
  };
}

/**
 * Run batch A/B tests on a session
 * Tests each turn with/without snippets
 */
export async function runSessionABTest(
  conversationId: string,
  baseRequest: Omit<RuntimeContextRequest, 'turnId'>,
  turns: Array<{ turnId: string; userMessage: string }>,
  modelCall: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<{
  results: ABTestResult[];
  summary: {
    totalTests: number;
    improved: number;
    regressed: number;
    neutral: number;
    avgScoreDelta: number;
  };
}> {
  console.log(`🧪 Running session A/B test on ${turns.length} turns...`);
  
  const results: ABTestResult[] = [];
  
  for (const turn of turns) {
    const request: RuntimeContextRequest = {
      ...baseRequest,
      turnId: turn.turnId,
    };
    
    // Add user message to lastTurns
    request.lastTurns = [...(request.lastTurns || []), turn.userMessage];
    
    const result = await runABTest({
      request,
      modelCall,
    });
    
    results.push(result);
  }
  
  // Calculate summary
  const improved = results.filter((r) => r.improved).length;
  const regressed = results.filter((r) => r.scoreDelta < 0).length;
  const neutral = results.filter((r) => r.scoreDelta === 0).length;
  const avgScoreDelta =
    results.reduce((sum, r) => sum + r.scoreDelta, 0) / results.length;
  
  const summary = {
    totalTests: results.length,
    improved,
    regressed,
    neutral,
    avgScoreDelta: Math.round(avgScoreDelta * 100) / 100,
  };
  
  console.log('🎯 Session A/B Test Summary:');
  console.log(`   Total Tests: ${summary.totalTests}`);
  console.log(`   Improved: ${summary.improved} (${Math.round((summary.improved / summary.totalTests) * 100)}%)`);
  console.log(`   Regressed: ${summary.regressed} (${Math.round((summary.regressed / summary.totalTests) * 100)}%)`);
  console.log(`   Neutral: ${summary.neutral} (${Math.round((summary.neutral / summary.totalTests) * 100)}%)`);
  console.log(`   Avg Score Delta: ${summary.avgScoreDelta > 0 ? '+' : ''}${summary.avgScoreDelta}`);
  
  return {
    results,
    summary,
  };
}

/**
 * Replay a session with A/B testing
 * Uses stored session evaluation to replay turns
 */
export async function replaySessionWithABTest(
  session: SessionEvaluation,
  baseRequest: Omit<RuntimeContextRequest, 'turnId' | 'lastTurns'>,
  modelCall: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<{
  results: ABTestResult[];
  summary: {
    totalTests: number;
    improved: number;
    regressed: number;
    neutral: number;
    avgScoreDelta: number;
  };
}> {
  console.log(`🔄 Replaying session ${session.conversationId} with A/B testing...`);
  
  // Extract turns from session transcript
  const turns = (session.transcript || [])
    .filter((t: any) => t.speaker === 'user')
    .map((t: any, idx: number) => ({
      turnId: `turn-${idx}`,
      userMessage: t.text,
    }));
  
  return runSessionABTest(session.conversationId, baseRequest, turns, modelCall);
}

/**
 * Simple scorer based on rubric evaluation
 * Returns score 0-100
 */
export function scoreResponseByRubric(
  response: string,
  expectedCriteria: {
    oneQuestion: boolean;
    brief: boolean;
    noAISelfRef: boolean;
    noBackendMention: boolean;
  }
): number {
  let score = 100;
  
  // Check one question
  const questionCount = (response.match(/\?/g) || []).length;
  if (questionCount > 1 && expectedCriteria.oneQuestion) {
    score -= 25;
  }
  
  // Check brevity (≤2 sentences)
  const sentences = response.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2 && expectedCriteria.brief) {
    score -= 20;
  }
  
  // Check AI self-reference
  const aiSelfRefPattern = /(i'm an ai|i am an ai|as an ai|as a language model)/i;
  if (aiSelfRefPattern.test(response) && expectedCriteria.noAISelfRef) {
    score -= 50; // Critical violation
  }
  
  // Check backend mention
  const backendPattern = /(ghl|go high level|crm system|backend|database)/i;
  if (backendPattern.test(response) && expectedCriteria.noBackendMention) {
    score -= 50; // Critical violation
  }
  
  return Math.max(0, score);
}

