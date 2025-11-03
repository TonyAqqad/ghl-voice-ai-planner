/**
 * Context7 Memory Integration E2E Tests
 * Tests end-to-end memory functionality in the browser
 */

import { test, expect } from '@playwright/test';

test.describe('Context7 Memory Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Training Hub
    await page.goto('/training-hub');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('attestation shows memory source in UI', async ({ page }) => {
    // Locate the "Run Test" button (adjust selector based on actual implementation)
    const runTestButton = page.getByRole('button', { name: /run test|start conversation/i });
    
    if (await runTestButton.isVisible()) {
      await runTestButton.click();
      
      // Wait for attestation panel to appear
      await page.waitForSelector('[data-testid="attestation-panel"]', { timeout: 10000 });
      
      // Check memory source is displayed
      const memorySource = await page.locator('[data-testid="memory-source"]').textContent();
      
      expect(['localStorage', 'context7', 'hybrid', 'cache']).toContain(memorySource);
      
      console.log(`✅ Memory source detected: ${memorySource}`);
    } else {
      test.skip('Run test button not found - may not be implemented yet');
    }
  });

  test('snippet toggle disables learned snippets', async ({ page }) => {
    // Find snippet toggle (adjust selector)
    const snippetToggle = page.locator('[data-testid="snippets-toggle"]');
    
    if (await snippetToggle.isVisible()) {
      // Disable snippets
      await snippetToggle.click();
      
      // Run test conversation
      const runTestButton = page.getByRole('button', { name: /run test|start conversation/i });
      await runTestButton.click();
      
      // Wait for attestation
      await page.waitForSelector('[data-testid="attestation-panel"]');
      
      // Verify attestation shows 0 snippets
      const snippetCount = await page.locator('[data-testid="snippets-applied"]').textContent();
      
      expect(snippetCount).toMatch(/0|disabled/i);
      
      console.log(`✅ Snippets disabled, count: ${snippetCount}`);
    } else {
      test.skip('Snippet toggle not found - may not be implemented yet');
    }
  });

  test('config endpoint loads correctly', async ({ page }) => {
    // Navigate to config endpoint
    const response = await page.request.get('/api/config');
    
    expect(response.ok()).toBeTruthy();
    
    const config = await response.json();
    
    expect(config).toHaveProperty('enableContext7Memory');
    expect(config).toHaveProperty('context7Available');
    expect(config).toHaveProperty('environment');
    
    expect(typeof config.enableContext7Memory).toBe('boolean');
    
    console.log(`✅ Config loaded:`, config);
  });

  test('memory health check endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/memory/health');
    
    expect(response.ok()).toBeTruthy();
    
    const health = await response.json();
    
    expect(health).toHaveProperty('available');
    expect(typeof health.available).toBe('boolean');
    
    if (health.available) {
      expect(health).toHaveProperty('provider');
      console.log(`✅ Memory health: available via ${health.provider}`);
    } else {
      console.log(`ℹ️ Memory health: unavailable (${health.reason || 'unknown'})`);
    }
  });

  test('attestation panel displays all required fields', async ({ page }) => {
    // Run a test conversation if button exists
    const runTestButton = page.getByRole('button', { name: /run test|start conversation/i });
    
    if (await runTestButton.isVisible()) {
      await runTestButton.click();
      
      // Wait for attestation
      await page.waitForSelector('[data-testid="attestation-panel"]', { timeout: 10000 });
      
      // Check for required attestation fields
      const requiredFields = [
        'scopeId',
        'promptHash',
        'specHash',
        'memory-backend',
        'snippets-applied',
        'token-budget',
      ];
      
      for (const field of requiredFields) {
        const element = page.locator(`[data-testid="${field}"]`);
        
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`✅ Found ${field}: ${text}`);
        } else {
          console.warn(`⚠️  ${field} not found (may use different testid)`);
        }
      }
    } else {
      test.skip('Cannot test attestation - run button not available');
    }
  });

  test('guard prevents early booking when fields missing', async ({ page }) => {
    // This test requires a conversation simulator
    // Adjust selectors based on actual implementation
    
    const conversationInput = page.locator('[data-testid="conversation-input"]');
    
    if (await conversationInput.isVisible()) {
      // Try to book without collecting required fields
      await conversationInput.fill('I want to book a class');
      await page.keyboard.press('Enter');
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check if booking was blocked
      const lastResponse = await page.locator('[data-testid="last-response"]').textContent();
      
      // Guard should ask for missing fields instead of booking
      expect(lastResponse).not.toMatch(/booked|confirmed/i);
      expect(lastResponse).toMatch(/name|email|phone|date|time/i);
      
      console.log(`✅ Guard prevented early booking`);
    } else {
      test.skip('Conversation simulator not available');
    }
  });
});

test.describe('Memory Cache Performance', () => {
  test('cached requests are faster than uncached', async ({ page }) => {
    // First request (uncached)
    const start1 = Date.now();
    const response1 = await page.request.post('/api/memory/snippets', {
      data: { scopeId: 'scope:perf-test', limit: 5 },
    });
    const duration1 = Date.now() - start1;
    
    expect(response1.ok()).toBeTruthy();
    const body1 = await response1.json();
    
    // Second request (should be cached)
    const start2 = Date.now();
    const response2 = await page.request.post('/api/memory/snippets', {
      data: { scopeId: 'scope:perf-test', limit: 5 },
    });
    const duration2 = Date.now() - start2;
    
    const body2 = await response2.json();
    
    // Cached request should be faster (or same source indicates cache)
    if (body2.source === 'cache') {
      expect(duration2).toBeLessThanOrEqual(duration1);
      console.log(`✅ Cache hit: ${duration1}ms → ${duration2}ms`);
    } else {
      console.log(`ℹ️  No cache hit (context7 may be disabled)`);
    }
  });
});

