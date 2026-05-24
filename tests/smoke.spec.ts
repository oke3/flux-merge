import { test, expect } from '@playwright/test';

/**
 * Flux Merge Smoke Suite
 * Validates the production boot sequence across multiple device viewports.
 */

const VIEWPORTS = [
  { name: 'Mobile', width: 390, height: 844 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

test.describe('Production Boot Sequence', () => {
  for (const viewport of VIEWPORTS) {
    test(`should boot without errors on ${viewport.name} viewport`, async ({ page }) => {
      // 1. Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // 2. Capture console errors
      const errors: string[] = [];
      page.on('pageerror', (exception) => {
        errors.push(`Uncaught Exception: ${exception.message}`);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('navigator.vibrate')) {
            errors.push(`Console Error: ${text}`);
          }
        }
      });

      // 3. Load the game
      // For local testing, we use the Vite dev server or the built index.html
      // In CI, this would be the deployed URL.
      await page.goto('http://localhost:5173');

      // 4. Wait for the canvas to be present and visible
      const canvas = page.locator('canvas#gameCanvas');
      await expect(canvas).toBeVisible();

      // 5. Verification
      if (errors.length > 0) {
        throw new Error(`Boot failed with ${errors.length} errors:\\n${errors.join('\\n')}`);
      }
    });
  }
});
