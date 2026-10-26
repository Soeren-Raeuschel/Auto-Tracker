import { expect, test } from '@playwright/test';

// T12.2: drei Kernpfade als Smoke-Tests. Jeder Test startet mit leerem
// localStorage, damit die Reihenfolge deterministisch ist (Default-Settings).

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.clear());
});

test('Ranking lädt mit HeroCard und RankRows', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Rangliste' })).toBeVisible();
  const rows = page.locator('article.rank-row');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
});

test('Gewicht ändern sortiert das Ranking um', async ({ page }) => {
  await page.goto('/');
  const firstRowName = page.locator('article.rank-row .rank-row__name').first();
  await expect(firstRowName).toBeVisible();
  const before = await firstRowName.textContent();

  // Preis von Gewicht 3 auf 0 -> Ranking muss sich neu sortieren.
  const priceSlider = page.getByLabel('Gewicht für Preis');
  await expect(priceSlider).toBeVisible();
  await priceSlider.fill('0');

  // Live-Sortierung (SettingsChanged -> ScoringEngine) ohne Reload prüfen.
  await expect(firstRowName).not.toHaveText(before ?? '', { timeout: 10_000 });
});

test('Auto zur Watchlist hinzufügen (Status watching) bleibt erhalten', async ({ page }) => {
  await page.goto('/');
  // HeroCard (erster Auto-Link) oeffnet die Detailseite.
  const carLink = page.locator('a[href*="/car/"]').first();
  await carLink.click();
  const group = page.getByRole('group', { name: 'Status' });
  await expect(group).toBeVisible();

  // Default ist "watching"; erst weg, dann explizit zurueck auf die Watchlist.
  await group.getByRole('button', { name: 'Interessant' }).click();
  await group.getByRole('button', { name: 'Beobachten' }).click();

  const stored = await page.evaluate(() => localStorage.getItem('auto-tracker:user-state'));
  expect(stored).toContain('"status":"watching"');

  // Persistenz: zurueck zum Ranking, Auto erneut oeffnen (frischer Hook-Load).
  await page.getByRole('link', { name: 'Ranking' }).first().click();
  await page.locator('a[href*="/car/"]').first().click();
  await expect(
    page.getByRole('group', { name: 'Status' }).getByRole('button', { name: 'Beobachten' }),
  ).toHaveAttribute('aria-pressed', 'true');
});
