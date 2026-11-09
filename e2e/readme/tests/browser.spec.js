// Browser side of the README: build the app with Vite, open it in Chromium and
// check that every snippet actually draws a flag.
import { test, expect } from '@playwright/test';

const errors = [];

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('requestfailed', (req) => errors.push(`request failed: ${req.url()}`));
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('ok');
  await page.waitForLoadState('networkidle');
});

/** The element is on screen with a real size. */
async function visible(locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box?.width).toBeGreaterThan(10);
  expect(box?.height).toBeGreaterThan(10);
}

/** An <img> loaded (not a broken image). */
async function loaded(img) {
  await visible(img);
  expect(await img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
}

/** A CSS-class flag has a background image that actually loads. */
async function cssFlag(span) {
  await visible(span);
  const bg = await span.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toMatch(/^url\(/);
  const url = bg.slice(5, -2);
  const ok = await span.evaluate(
    (_el, src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth > 0);
        img.onerror = () => resolve(false);
        img.src = src;
      }),
    url,
  );
  expect(ok).toBe(true);
}

test('1. CSS classes: <span class="pn pn-cl"> shows Chile', async ({ page }) => {
  const span = page.getByRole('img', { name: 'Chile' }).and(page.locator('#css span'));
  await cssFlag(span);
});

test('2. Image or CDN: the jsDelivr <img> loads', async ({ page }) => {
  await loaded(page.locator('#cdn img'));
});

test('3. One module per flag: renderFlag(cl, { shape: "circle" })', async ({ page }) => {
  await visible(page.locator('#module > svg'));
});

test("4. Lazy: loadFlag('cl'), the rect shape and getPennantName", async ({ page }) => {
  const flags = page.locator('#lazy > svg');
  await expect(flags).toHaveCount(2);
  await visible(flags.first());
  await visible(flags.nth(1));
  expect(await flags.first().getAttribute('viewBox')).toBe('0 0 66 72'); // pennant
  expect(await flags.nth(1).getAttribute('viewBox')).toBe('0 0 64 48'); // rect 4:3
  await expect(page.locator('#name')).toHaveText('Alemania');
});

test('5. React: <Pennant code="cl" size={32} /> with an accessible name', async ({ page }) => {
  await expect(page.locator('#react').getByRole('img', { name: 'Chile' })).toHaveCount(1);
  const svg = page.locator('#react svg[viewBox="0 0 66 72"]');
  await visible(svg);
  expect(Math.round((await svg.boundingBox()).height)).toBe(32);
  expect(await svg.locator('path, image, rect').count()).toBeGreaterThan(0); // artwork loaded
});

test('6. Web Component: <pennant-flag code="cl" size="32">', async ({ page }) => {
  const el = page.locator('#element pennant-flag');
  await visible(el);
  expect(await el.evaluate((node) => !!(node.shadowRoot ?? node).querySelector('svg, img'))).toBe(
    true,
  );
  await expect(el).toHaveAttribute('role', 'img');
  await expect(el).toHaveAttribute('aria-label', 'Chile');
  expect(Math.round((await el.boundingBox()).height)).toBe(32);
});

test('7. Shapes: pennants/css and pennants/css/circle on one page', async ({ page }) => {
  const pennant = page.locator('#shapes [aria-label="Chile pennant"]');
  const circle = page.locator('#shapes [aria-label="Chile circle"]');
  await cssFlag(pennant);
  await cssFlag(circle);
  const p = await pennant.boundingBox();
  const c = await circle.boundingBox();
  expect(Math.round(c.width)).toBe(Math.round(c.height)); // circle is 1:1
  expect(p.height).toBeGreaterThan(p.width); // pennant is taller than wide (66:72)
});

test('8. Files: svg/circle and png/pennant 1x/2x', async ({ page }) => {
  await loaded(page.locator('#svg-circle'));
  await loaded(page.locator('#png'));
});

test('9. En español snippet', async ({ page }) => {
  await cssFlag(page.locator('#es span'));
});

test('no console errors or failed requests', async ({ page }) => {
  await page.screenshot({ path: 'test-results/readme-check.png', fullPage: true });
  expect(errors).toEqual([]);
});
