import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ready } from "./helpers/ready.js";
import { openLibraryFilters } from "./helpers/library.js";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?preset=builtin.standing-female");
  await ready(page);
});
test.afterEach(() => expect(errors).toEqual([]));

async function audit(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
}

async function screenshot(page, info, name) {
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: info.outputPath(name) });
}

test("search icons and actions stay in one aligned row before, during and after typing", async ({ page }, info) => {
  for (const [width, height] of [[1440, 1000], [1080, 768], [390, 844], [320, 700]]) {
    await page.setViewportSize({ width, height });
    if (width <= 900) await page.locator('[data-region="library"]').click();
    const search = page.getByLabel("Search positions", { exact: true });
    const box = page.locator(".search-box");
    const before = await box.boundingBox();
    await search.fill("standing");
    await expect(page.locator(".clear-search")).toBeVisible();
    await expect(page.getByRole("tooltip")).toBeHidden();
    const after = await box.boundingBox();
    expect(after.height).toBe(before.height);
    const input = await search.boundingBox();
    const icon = await box.locator(":scope > .ui-icon").boundingBox();
    const clear = await page.locator(".clear-search").boundingBox();
    const filter = await page.locator(".filter-toggle").boundingBox();
    for (const item of [icon, clear, filter])
      expect(Math.abs(item.y + item.height / 2 - input.y - input.height / 2)).toBeLessThan(0.5);
    expect(icon.x + icon.width).toBeLessThanOrEqual(input.x);
    expect(input.x + input.width).toBeLessThanOrEqual(clear.x);
    expect(clear.x + clear.width).toBeLessThanOrEqual(filter.x);
    expect(filter.x + filter.width).toBeLessThanOrEqual(after.x + after.width);
    await expect(page.locator(".clear-search .ui-icon")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await audit(page);
    await screenshot(page, info, `integrated-search-${width}.png`);
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await expect(search).toHaveValue("");
    await expect(search).toBeFocused();
    expect((await box.boundingBox()).height).toBe(before.height);
  }
});

test("applied-filter chips remove one condition without losing search, other filters or keyboard focus", async ({ page }, info) => {
  await openLibraryFilters(page);
  await page.getByLabel("Category", { exact: true }).selectOption("Together");
  await page.getByLabel("Support status", { exact: true }).selectOption("verified-3d");
  await page.locator(".filter-toggle").click();
  const filters = page.getByRole("group", { name: "Active filters", exact: true });
  await expect(filters).toBeVisible();
  await expect(filters.locator(".filter-chip")).toHaveCount(2);
  const search = page.getByLabel("Search positions", { exact: true });
  await search.fill("standing");
  await expect(page.locator(".filter-toggle")).toHaveAccessibleName("Filters (2)");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator("#catalog-category")).toHaveValue("Together");
  await expect(page.locator("#catalog-status")).toHaveValue("verified-3d");
  await search.fill("standing");
  await filters.getByRole("button", { name: "Remove Category filter: Together", exact: true }).click();
  await expect(page.locator("#catalog-category")).toHaveValue("all");
  await expect(page.locator("#catalog-status")).toHaveValue("verified-3d");
  const status = filters.getByRole("button", { name: "Remove Support status filter: Verified 3D preset", exact: true });
  await expect(status).toBeFocused();
  await expect(search).toHaveValue("standing");
  await expect(page.locator(".filter-toggle")).toHaveAccessibleName("Filters (1)");
  await page.keyboard.press("Enter");
  await expect(filters).toBeHidden();
  await expect(page.locator(".filter-toggle")).toBeFocused();
  await expect(search).toHaveValue("standing");
  await openLibraryFilters(page);
  await page.getByLabel("Category", { exact: true }).selectOption("Acrobatic & supported");
  await page.getByLabel("Support status", { exact: true }).selectOption("authored-3d");
  await search.fill("");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(filters).toBeHidden();
  await expect(page.locator("#catalog-category")).toHaveValue("all");
  await expect(page.locator("#catalog-status")).toHaveValue("all");
  await expect(page.locator(".filter-toggle")).toBeFocused();
  await audit(page);
  await screenshot(page, info, "panel-filter-workflow.png");
});

test("panel components share a visual hierarchy while disclosures and figure controls retain their behavior", async ({ page }, info) => {
  await expect(page.locator("#scene-controls > .panel-section")).toHaveCount(3);
  await expect(page.locator("#scene-controls > .panel-section .panel-section-heading > h2 > .ui-icon")).toHaveCount(3);
  const composer = page.locator(".description-composer");
  await expect(composer.getByLabel("Pose description")).toBeVisible();
  await expect(composer.getByRole("button", { name: "Apply description", exact: true })).toBeVisible();
  const sceneBefore = await page.locator("#scene-title").textContent();
  await audit(page);
  await screenshot(page, info, "panel-design-desktop-scene.png");
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  const properties = page.locator(".figure-properties");
  const type = await properties.getByLabel("Body type", { exact: true }).boundingBox();
  const posture = await properties.getByLabel("Posture", { exact: true }).boundingBox();
  expect(posture.y).toBe(type.y);
  expect(posture.x).toBeGreaterThan(type.x + type.width);
  await screenshot(page, info, "panel-design-desktop-figures.png");
  await page.getByText("Appearance", { exact: true }).click();
  await page.getByText("Placement", { exact: true }).click();
  await expect(page.locator(".actor-card > .panel-group[open]")).toHaveCount(2);
  await expect(page.getByLabel("Solved placement", { exact: true })).toBeVisible();
  await page.getByLabel("Keep placement", { exact: true }).check();
  await ready(page);
  await expect(page.getByLabel("Keep placement", { exact: true })).toBeChecked();
  await page.locator("#undo").click();
  await ready(page);
  await expect(page.getByLabel("Keep placement", { exact: true })).not.toBeChecked();
  await expect(page.locator("#scene-title")).toHaveText(sceneBefore);
  await audit(page);
  await screenshot(page, info, "panel-design-desktop-details.png");
  await page.getByRole("button", { name: "+ Add figure", exact: true }).click();
  await ready(page);
  await page.getByRole("button", { name: "Scene", exact: true }).click();
  await page.getByRole("button", { name: "+ Add contact", exact: true }).click();
  await ready(page);
  const strength = page.getByLabel("Pull strength", { exact: true });
  await expect(strength).toHaveValue("1");
  expect(await strength.evaluate((node) => node.style.getPropertyValue("--fill"))).toBe("100%");
  await strength.press("Home");
  await strength.press("ArrowRight");
  await ready(page);
  await expect(strength).toHaveValue("0.05");
  await expect(page.locator(".contact-strength output")).toHaveText("5%");
  expect(await strength.evaluate((node) => node.style.getPropertyValue("--fill"))).toBe("5%");
  await expect(page.locator(".contact-card .contact-result")).toBeVisible();
});

test("high-contrast mode retains a visible search focus indicator and native checkbox/slider controls", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByLabel("Search positions", { exact: true }).focus();
  await expect(page.locator(".search-box")).toHaveCSS("outline-style", "solid");
  await expect(page.locator(".search-box")).toHaveCSS("outline-width", "2px");
  await expect(page.locator(".library-scopes .active")).toHaveCSS("outline-style", "solid");
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await expect(page.getByLabel("Height", { exact: true })).toHaveCSS("appearance", "auto");
  await page.getByText("Placement", { exact: true }).click();
  const fixed = page.getByLabel("Keep placement", { exact: true });
  await expect(fixed).toHaveCSS("appearance", "auto");
  await fixed.focus();
  await page.keyboard.press("Space");
  await ready(page);
  await expect(fixed).toBeChecked();
  await audit(page);
});

test.describe("touch and localized panel components", () => {
  test.use({ hasTouch: true });
  test("Chinese search, removable filters and compact editor components fit narrow screens", async ({ page }, info) => {
    await page.goto("/?preset=builtin.standing-female&lang=zh");
    await expect(page.locator("#status")).toContainText("就绪", { timeout: 60_000 });
    for (const [width, height] of [[320, 700], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.locator('[data-region="library"]').tap();
      await page.locator("#catalog-search").fill("站");
      const bar = await page.locator(".search-box").boundingBox();
      for (const selector of [".clear-search", ".filter-toggle"]) {
        const rect = await page.locator(selector).boundingBox();
        expect(rect.height).toBeGreaterThanOrEqual(40);
        expect(rect.y).toBeGreaterThanOrEqual(bar.y);
        expect(rect.y + rect.height).toBeLessThanOrEqual(bar.y + bar.height);
      }
      await page.locator(".clear-search").tap();
      if (await page.locator("#catalog-filters").isHidden()) await page.locator(".filter-toggle").tap();
      await page.locator("#catalog-category").selectOption({ index: 1 });
      await page.locator(".filter-toggle").tap();
      await expect(page.getByRole("group", { name: "已应用的筛选条件", exact: true })).toBeVisible();
      await page.locator(".filter-chip:not([hidden])").tap();
      await expect(page.locator("#catalog-category")).toHaveValue("all");
      await page.locator('[data-region="edit"]').tap();
      await expect(page.locator(".description-composer")).toBeVisible();
      await audit(page);
      await screenshot(page, info, `panel-design-chinese-${width}.png`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});
