import { evaluateSession, extractFieldCaptures } from '../sessionEvaluator';
import { ConversationTurn } from '../types';

describe('sessionEvaluator', () => {
  describe('extractFieldCaptures', () => {
    it('should extract firstName from a single word response', () => {
      const turns: ConversationTurn[] = [
        { id: 't1', role: 'agent', text: "What's your first name?", ts: 1 },
        { id: 't2', role: 'caller', text: 'Tony', ts: 2 },
      ];

      const fields = extractFieldCaptures(turns);
      
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        key: 'firstName',
        value: 'Tony',
        turnId: 't2',
        valid: true,
        source: 'detected',
      });
    });

    it('should extract email from caller text', () => {
      const turns: ConversationTurn[] = [
        { id: 't1', role: 'agent', text: "What's your email?", ts: 1 },
        { id: 't2', role: 'caller', text: 'tony@example.com', ts: 2 },
      ];

      const fields = extractFieldCaptures(turns);
      
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        key: 'email',
        value: 'tony@example.com',
        turnId: 't2',
        valid: true,
        source: 'detected',
      });
    });

    it('should extract phone from caller text', () => {
      const turns: ConversationTurn[] = [
        { id: 't1', role: 'agent', text: "What's your phone number?", ts: 1 },
        { id: 't2', role: 'caller', text: '555-123-4567', ts: 2 },
      ];

      const fields = extractFieldCaptures(turns);
      
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        key: 'phone',
        value: '555-123-4567',
        turnId: 't2',
        valid: true,
        source: 'detected',
      });
    });

    it('should not extract fields from agent messages', () => {
      const turns: ConversationTurn[] = [
        { id: 't1', role: 'agent', text: 'My name is Agent and my email is agent@example.com', ts: 1 },
      ];

      const fields = extractFieldCaptures(turns);
      
      expect(fields).toHaveLength(0);
    });

    it('should return empty array when no fields are detected', () => {
      const turns: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: 'Hello there', ts: 1 },
        { id: 't2', role: 'agent', text: 'Hi, how can I help?', ts: 2 },
        { id: 't3', role: 'caller', text: 'Just saying hi', ts: 3 },
      ];

      const fields = extractFieldCaptures(turns);
      
      expect(fields).toHaveLength(0);
    });
  });

  describe('evaluateSession - Happy Path', () => {
    it('should correctly evaluate a successful booking conversation', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: "Hey I'd like to book a trial class", ts: 1 },
        { id: 't2', role: 'agent', text: "Perfect! I'll grab four quick pieces of info. What's your first name?", ts: 2 },
        { id: 't3', role: 'caller', text: 'Tony', ts: 3 },
        { id: 't4', role: 'agent', text: "Great Tony — what's the best email?", ts: 4 },
        { id: 't5', role: 'caller', text: 'tony@example.com', ts: 5 },
        { id: 't6', role: 'agent', text: "Awesome. I'll book you for a 5pm PST slot. Does that work?", ts: 6 },
        { id: 't7', role: 'caller', text: 'Yes that works', ts: 7 },
      ];

      const result = evaluateSession('conv-happy-123', transcript, 'v1.1');

      // Check basic structure
      expect(result.conversationId).toBe('conv-happy-123');
      expect(result.version).toBe('v1.1');
      expect(result.startedAt).toBe(1);
      expect(result.endedAt).toBe(7);
      expect(result.correctionsApplied).toBe(0);

      // Check fields captured
      expect(result.collectedFields.length).toBeGreaterThanOrEqual(2);
      const firstNameField = result.collectedFields.find(f => f.key === 'firstName');
      const emailField = result.collectedFields.find(f => f.key === 'email');
      expect(firstNameField).toBeDefined();
      expect(firstNameField?.value).toBe('Tony');
      expect(emailField).toBeDefined();
      expect(emailField?.value).toBe('tony@example.com');

      // Check booking confirmed
      const bookingField = result.collectedFields.find(f => f.key === 'bookingConfirmed');
      expect(bookingField).toBeDefined();

      // Check rubric scores
      const fieldCollectionScore = result.rubric.find(r => r.key === 'fieldCollection');
      expect(fieldCollectionScore?.score).toBe(5); // Should pass

      const bookingRulesScore = result.rubric.find(r => r.key === 'bookingRules');
      expect(bookingRulesScore?.score).toBe(5); // Should pass

      const verificationScore = result.rubric.find(r => r.key === 'verification');
      expect(verificationScore?.score).toBeGreaterThanOrEqual(2); // Should attempt verification

      const objectionHandlingScore = result.rubric.find(r => r.key === 'objectionHandling');
      expect(objectionHandlingScore?.score).toBeNull(); // No objections in this call
      expect(objectionHandlingScore?.notes).toContain('Not tested');

      // Check confidence is reasonable
      expect(result.confidence).toBeGreaterThan(60);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should not default all rubric scores to 4.0', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: "I'd like to book", ts: 1 },
        { id: 't2', role: 'agent', text: "Great! What's your name?", ts: 2 },
        { id: 't3', role: 'caller', text: 'Tony', ts: 3 },
      ];

      const result = evaluateSession('conv-guardrail-123', transcript, 'v1.1');

      // Ensure not all scores are 4
      const scores = result.rubric.filter(r => r.score !== null).map(r => r.score);
      const allAreFour = scores.every(s => s === 4);
      expect(allAreFour).toBe(false);
    });
  });

  describe('evaluateSession - No Fields Case', () => {
    it('should score low when only small talk occurs', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: 'Hello', ts: 1 },
        { id: 't2', role: 'agent', text: 'Hi there! How are you?', ts: 2 },
        { id: 't3', role: 'caller', text: 'Good thanks, you?', ts: 3 },
        { id: 't4', role: 'agent', text: 'Doing well!', ts: 4 },
      ];

      const result = evaluateSession('conv-smalltalk-123', transcript, 'v1.1');

      // No fields should be collected
      expect(result.collectedFields).toHaveLength(0);

      // Field collection should fail
      const fieldCollectionScore = result.rubric.find(r => r.key === 'fieldCollection');
      expect(fieldCollectionScore?.score).toBe(2); // Failed score

      // Confidence should be low
      expect(result.confidence).toBeLessThan(60);
    });
  });

  describe('evaluateSession - Objection Handling', () => {
    it('should score objectionHandling when objection is raised and handled', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: 'Tell me about your pricing', ts: 1 },
        { id: 't2', role: 'agent', text: 'Our trial class is $30', ts: 2 },
        { id: 't3', role: 'caller', text: "That's too expensive for me", ts: 3 },
        { id: 't4', role: 'agent', text: 'I understand. We have payment plans and can work with your budget', ts: 4 },
        { id: 't5', role: 'caller', text: 'Okay that sounds better', ts: 5 },
      ];

      const result = evaluateSession('conv-objection-123', transcript, 'v1.1');

      // Objection handling should be scored (not null)
      const objectionHandlingScore = result.rubric.find(r => r.key === 'objectionHandling');
      expect(objectionHandlingScore?.score).not.toBeNull();
      expect(objectionHandlingScore?.score).toBe(5); // Should pass
      expect(objectionHandlingScore?.notes).toContain('Handled');
    });

    it('should score objectionHandling low when objection is not handled', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: 'Tell me about pricing', ts: 1 },
        { id: 't2', role: 'agent', text: 'It costs $100', ts: 2 },
        { id: 't3', role: 'caller', text: "That's too expensive", ts: 3 },
        { id: 't4', role: 'agent', text: 'Okay bye', ts: 4 },
      ];

      const result = evaluateSession('conv-objection-fail-123', transcript, 'v1.1');

      // Objection handling should be scored low
      const objectionHandlingScore = result.rubric.find(r => r.key === 'objectionHandling');
      expect(objectionHandlingScore?.score).toBe(2); // Failed score
    });

    it('should set objectionHandling to null when no objection occurs', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: "I'd like to book", ts: 1 },
        { id: 't2', role: 'agent', text: "Great! What's your name?", ts: 2 },
        { id: 't3', role: 'caller', text: 'Tony', ts: 3 },
      ];

      const result = evaluateSession('conv-no-objection-123', transcript, 'v1.1');

      // Objection handling should be null (N/A)
      const objectionHandlingScore = result.rubric.find(r => r.key === 'objectionHandling');
      expect(objectionHandlingScore?.score).toBeNull();
      expect(objectionHandlingScore?.notes).toContain('Not tested');
    });
  });

  describe('evaluateSession - Confidence Calculation', () => {
    it('should exclude null scores from confidence calculation', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'caller', text: "I'd like to book", ts: 1 },
        { id: 't2', role: 'agent', text: "What's your first name?", ts: 2 },
        { id: 't3', role: 'caller', text: 'Tony', ts: 3 },
        { id: 't4', role: 'agent', text: "What's your email?", ts: 4 },
        { id: 't5', role: 'caller', text: 'tony@example.com', ts: 5 },
      ];

      const result = evaluateSession('conv-confidence-123', transcript, 'v1.1');

      // Find scores that are null
      const nullScores = result.rubric.filter(r => r.score === null);
      expect(nullScores.length).toBeGreaterThan(0); // Should have tone and objectionHandling as null

      // Confidence should be calculated only from non-null scores
      const scoredRubrics = result.rubric.filter(r => r.score !== null);
      const expectedConfidence = Math.round(
        (scoredRubrics.reduce((sum, r) => sum + (r.score ?? 0), 0) / (scoredRubrics.length * 5)) * 100
      );
      
      expect(result.confidence).toBe(expectedConfidence);
    });

    it('should return 0 confidence when no rubrics are scored', () => {
      // This is a theoretical case, but good to test
      const transcript: ConversationTurn[] = [];

      const result = evaluateSession('conv-empty-123', transcript, 'v1.1');

      expect(result.confidence).toBe(0);
    });
  });

  describe('evaluateSession - Edge Cases', () => {
    it('should handle empty conversation', () => {
      const transcript: ConversationTurn[] = [];

      const result = evaluateSession('conv-empty-123', transcript, 'v1.1');

      expect(result.conversationId).toBe('conv-empty-123');
      expect(result.collectedFields).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle conversation with only agent messages', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'agent', text: 'Hello?', ts: 1 },
        { id: 't2', role: 'agent', text: 'Are you there?', ts: 2 },
      ];

      const result = evaluateSession('conv-agent-only-123', transcript, 'v1.1');

      expect(result.collectedFields).toHaveLength(0);
    });

    it('should handle multiple fields in single turn', () => {
      const transcript: ConversationTurn[] = [
        { id: 't1', role: 'agent', text: 'Tell me your name and email', ts: 1 },
        { id: 't2', role: 'caller', text: 'Tony and tony@example.com', ts: 2 },
      ];

      const result = evaluateSession('conv-multiple-123', transcript, 'v1.1');

      expect(result.collectedFields.length).toBeGreaterThanOrEqual(2);
      expect(result.collectedFields.some(f => f.key === 'firstName')).toBe(true);
      expect(result.collectedFields.some(f => f.key === 'email')).toBe(true);
    });
  });
});

