const { describe, it, expect, vi, beforeEach } = require('vitest');

vi.mock('../providers/llm-utils', () => ({
  runLLM: vi.fn(),
}));

const { reviewResponse } = require('../masterAIManager');
const { runLLM } = require('../providers/llm-utils');

const createRes = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return {
    json,
    status,
  };
};

const baseReq = responseText => ({
  body: {
    agentId: 'agent-123',
    niche: 'fitness',
    systemPrompt: 'Follow the script.',
    response: responseText,
    conversation: [],
    qualityThreshold: 70,
    confidenceThreshold: 70,
    goldenDatasetMode: false,
    traceId: 'trace-test',
    llmProvider: 'mock',
  },
});

describe('reviewResponse', () => {
  beforeEach(() => {
    runLLM.mockReset();
  });

  it('auto-clears identical suggestions when date and time are already present', async () => {
    const agentReply =
      "Thanks, Leslie! You're all set for your trial class this Tuesday at 10 AM. We look forward to seeing you! If you have any questions before then, feel free to ask.";

    runLLM.mockResolvedValue({
      payload: {
        approved: false,
        score: 62,
        issues: ['Use specific date/time suggestions'],
        suggestions: ['Please provide a specific time in the confirmation.'],
        blockedReasons: ['Use Specific Date/Time Suggestions'],
        suggestedResponse: agentReply,
        confidenceScore: 90,
      },
      usage: { prompt_tokens: 100, completion_tokens: 60, total_tokens: 160 },
      model: 'gpt-auto',
    });

    const req = baseReq(agentReply);
    const res = createRes();

    await reviewResponse(req, res);

    expect(runLLM).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);

    const payload = res.json.mock.calls[0][0];

    expect(payload.ok).toBe(true);
    expect(payload.review.approved).toBe(true);
    expect(payload.review.issues).toEqual([]);
    expect(payload.review.blockedReasons).toEqual([]);
    expect(payload.review.score).toBeGreaterThanOrEqual(70);
    expect(payload.review.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Auto-cleared quality gate')])
    );
  });

  it('keeps gate blocked when other issues remain even if suggestion matches original', async () => {
    const agentReply =
      "Thanks, Leslie! You're all set for your trial class this Tuesday at 10 AM. We look forward to seeing you!";

    runLLM.mockResolvedValue({
      payload: {
        approved: false,
        score: 65,
        issues: ['Add a friendly closing line'],
        suggestions: ['Please add a friendly closing line to stay on-brand.'],
        blockedReasons: ['Tone adjustment required'],
        suggestedResponse: agentReply,
        confidenceScore: 88,
      },
      usage: { prompt_tokens: 90, completion_tokens: 55, total_tokens: 145 },
      model: 'gpt-auto',
    });

    const req = baseReq(agentReply);
    const res = createRes();

    await reviewResponse(req, res);

    expect(runLLM).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    const payload = res.json.mock.calls[0][0];

    expect(payload.review.approved).toBe(false);
    expect(payload.review.issues).toEqual(['Add a friendly closing line']);
    expect(payload.review.warnings).toEqual(
      expect.arrayContaining([
        'Suggested fix matches the original response—verify prompt alignment.',
      ])
    );
  });
});
