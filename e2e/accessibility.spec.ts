import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockPokeApi } from './fixtures/mock-api';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'] as const;

async function assertNoA11yViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    violations,
    violations.map(v => `[${v.impact}] ${v.id}: ${v.description}`).join('\n'),
  ).toHaveLength(0);
}

test.beforeEach(async ({ page }) => {
  await mockPokeApi(page);
});

// ─── WCAG 2.1 AA — automated axe audit ───────────────────────────────────────

test.describe('WCAG 2.1 AA', () => {
  test('home page passes axe audit', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pokemon-card')).toHaveCount(2);
    await assertNoA11yViolations(page);
  });

  test('detail overlay passes axe audit', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pokemon-card').first().click();
    await expect(page.locator('.overlay')).toBeVisible();
    await assertNoA11yViolations(page);
  });

  test('search results pass axe audit', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'ivy');
    await expect(page.locator('.pokemon-card')).toHaveCount(1);
    await assertNoA11yViolations(page);
  });

  test('no-results state passes axe audit', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'cha');
    await expect(page.locator('#search-no-results')).toBeVisible();
    await assertNoA11yViolations(page);
  });
});

// ─── Focus management (aria-dialog pattern) ──────────────────────────────────

test.describe('focus management', () => {
  test('overlay receives focus when opened', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pokemon-card').first().click();
    await expect(page.locator('.overlay')).toBeVisible();
    await expect(page.locator('.overlay')).toBeFocused();
  });

  test('focus returns to triggering card after Escape', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.pokemon-card').first();
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.overlay')).not.toBeAttached();
    await expect(card).toBeFocused();
  });
});

// ─── Keyboard activation ─────────────────────────────────────────────────────

test.describe('keyboard activation', () => {
  test('Enter key opens overlay from focused card', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pokemon-card').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.overlay')).toBeVisible();
    await expect(page.locator('.overlay')).toContainText('Bulbasaur');
  });

  test('Space key opens overlay from focused card', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pokemon-card').first().focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.overlay')).toBeVisible();
  });
});
