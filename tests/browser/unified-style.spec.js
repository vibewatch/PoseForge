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

async function iconOnly(control) {
  await expect(control.locator(":scope > .ui-icon")).toHaveCount(1);
  await expect(control).toHaveText("");
  await expect(control).toHaveAttribute("data-hint", /.+/);
}

async function screenshot(page, info, name) {
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: info.outputPath(name) });
}

async function audit(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
}

test("panel icon navigation, filter count and categories retain names and selected state", async ({ page }, info) => {
  for (const name of ["Positions", "Saved", "Favorites"])
    await iconOnly(page.locator(".library-scopes").getByRole("button", { name, exact: true }));
  for (const name of ["Scene", "Figures"])
    await iconOnly(page.locator(".inspector-tabs").getByRole("button", { name, exact: true }));
  await iconOnly(page.getByRole("button", { name: "Apply description", exact: true }));
  await iconOnly(page.getByRole("button", { name: "Standing study", exact: true }));
  await iconOnly(page.getByRole("button", { name: "Seated study", exact: true }));
  const saved = page.getByRole("button", { name: "Saved", exact: true });
  await saved.click();
  await expect(saved).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Search presets")).toBeVisible();
  await page.getByRole("button", { name: "Positions", exact: true }).click();
  const categories = page.locator(".position-browser > summary");
  await iconOnly(categories);
  await categories.click();
  await expect(page.locator(".position-browser-body")).toBeVisible();
  await categories.click();
  await expect(page.locator(".position-browser-body")).toBeHidden();
  await openLibraryFilters(page);
  await page.getByLabel("Category", { exact: true }).selectOption("Together");
  const filter = page.getByRole("button", { name: "Filters (1)", exact: true });
  await expect(filter.locator(".ui-icon")).toHaveCount(1);
  await expect(filter.locator(".icon-count")).toHaveText("1");
  await filter.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Filters (1)");
  await page.mouse.move(700, 500);
  await expect(page.getByRole("tooltip")).toBeHidden();
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.locator(".filter-toggle .icon-count")).toHaveCount(0);
  await expect(page.locator(".filter-toggle")).toHaveAccessibleName("Filters");
  await page.locator(".filter-toggle").click();
  await audit(page);
  await screenshot(page, info, "unified-desktop-scene.png");
});

test("grouped figure actions, removal and placement icons preserve authoring and history", async ({ page }, info) => {
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await iconOnly(page.getByRole("button", { name: "Capture current layout", exact: true }));
  await iconOnly(page.getByRole("button", { name: "+ Add figure", exact: true }));
  await iconOnly(page.getByRole("button", { name: "Remove figure", exact: true }));
  const remove = page.getByRole("button", { name: "Remove figure", exact: true });
  await expect(remove).toBeDisabled();
  const header = await page.locator(".actor-card h3").boundingBox();
  const trash = await remove.boundingBox();
  expect(trash.y).toBe(header.y);
  await page.getByRole("button", { name: "+ Add figure", exact: true }).click();
  await ready(page);
  await expect(page.locator(".actor-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Remove figure", exact: true }).last().click();
  await ready(page);
  await expect(page.locator(".actor-card")).toHaveCount(1);
  await page.locator("#undo").click();
  await ready(page);
  await expect(page.locator(".actor-card")).toHaveCount(2);
  await page.locator("#redo").click();
  await ready(page);
  await expect(page.locator(".actor-card")).toHaveCount(1);
  await page.getByText("Placement", { exact: true }).click();
  const help = page.locator(".placement-help");
  await iconOnly(help);
  await help.click();
  await expect(page.getByRole("tooltip")).toContainText("World position and XYZ rotation.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  const fields = await page.locator(".placement-fields > .field").all();
  const firstRow = await Promise.all(fields.slice(0, 3).map((field) => field.boundingBox()));
  expect(new Set(firstRow.map((box) => box.y)).size).toBe(1);
  expect(new Set(firstRow.map((box) => Math.round(box.width))).size).toBe(1);
  for (const name of ["Capture solved pose", "Use solved pose as guide", "Reset placement"])
    await iconOnly(page.getByRole("button", { name, exact: true }));
  await audit(page);
  await screenshot(page, info, "unified-desktop-figures.png");
});

test.describe("mobile icon navigation", () => {
  test.use({ hasTouch: true });
  test("consistent icon-only navigation and action groups fit phone and landscape screens", async ({ page }, info) => {
    for (const [width, height] of [[390, 844], [320, 700], [844, 390]]) {
      await page.setViewportSize({ width, height });
      for (const name of ["Library", "Studio", "Edit"]) {
        const button = page.locator(".mobile-nav").getByRole("button", { name, exact: true });
        await iconOnly(button);
        const box = await button.boundingBox();
        expect(box.height).toBe(44);
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
      await page.locator('[data-region="library"]').tap();
      const nav = await page.locator(".library-navigation").boundingBox();
      const category = await page.locator(".position-browser > summary").boundingBox();
      expect(category.y).toBeGreaterThanOrEqual(nav.y);
      expect(category.y + category.height).toBeLessThanOrEqual(nav.y + nav.height);
      await page.getByLabel("Search positions").fill("Kneeling Missionary");
      const favorite = await page.locator(".favorite").first().boundingBox();
      const details = await page.locator(".position-details").first().boundingBox();
      expect(favorite.y + favorite.height).toBeLessThanOrEqual(details.y);
      await page.getByRole("button", { name: "Clear search", exact: true }).click();
      await audit(page);
      await screenshot(page, info, `unified-library-${width}.png`);
      await page.locator('[data-region="edit"]').tap();
      await page.getByRole("button", { name: "Scene", exact: true }).click();
      for (const button of await page.locator(".description-actions .icon-control").all()) {
        const box = await button.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
      await page.getByRole("button", { name: "Figures", exact: true }).click();
      await audit(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await screenshot(page, info, `unified-figures-${width}.png`);
    }
    await page.goto("/?preset=builtin.standing-female&lang=zh");
    await expect(page.locator("#status")).toContainText("就绪", { timeout: 60_000 });
    await page.locator('[data-region="edit"]').tap();
    await expect(page.getByRole("button", { name: "场景", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "人物", exact: true }).click();
    await expect(page.getByRole("button", { name: "移除人物", exact: true })).toBeDisabled();
    await expect(page.locator(".mobile-nav [data-region='library']")).toHaveAccessibleName("姿势库");
    await audit(page);
  });
});
