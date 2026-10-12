import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ready } from "./helpers/ready.js";

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

async function snapshot(page, info, name) {
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: info.outputPath(name) });
}

test("full-width filters display long values and category browsing never stacks over them", async ({ page }, info) => {
  await page.locator(".filter-toggle").click();
  const closedBeforeToggle = await page.locator(".position-browser > summary").evaluate((summary) => {
    summary.click();
    return document.querySelector("#catalog-filters").hidden;
  });
  expect(closedBeforeToggle).toBe(true);
  await page.locator(".filter-toggle").click();
  for (const [width, height] of [[1440, 1000], [1080, 768], [390, 844], [320, 700]]) {
    await page.setViewportSize({ width, height });
    if (width <= 900) await page.locator('[data-region="library"]').click();
    if (await page.locator("#catalog-filters").isHidden()) await page.locator(".filter-toggle").click();
    await page.getByLabel("Category", { exact: true }).selectOption("Acrobatic & supported");
    await page.getByLabel("Support status", { exact: true }).selectOption("authored-3d");
    const fields = await page.locator("#catalog-filters .category-field").all();
    const first = await fields[0].boundingBox();
    const second = await fields[1].boundingBox();
    expect(second.y).toBeGreaterThan(first.y + first.height);
    expect(second.width).toBe(first.width);
    const labels = await page.locator("#catalog-filters .select-value").evaluateAll((nodes) =>
      nodes.map((node) => ({ text: node.textContent, visible: node.clientWidth, required: node.scrollWidth })));
    expect(labels.map((label) => label.text)).toEqual(["Acrobatic & supported", "Authored · unreviewed"]);
    labels.forEach((label) => expect(label.required).toBeLessThanOrEqual(label.visible));
    await expect(page.locator("#catalog-filters")).toBeInViewport({ ratio: 1 });
    await page.locator(".position-browser > summary").click();
    await expect(page.locator(".position-browser")).toHaveAttribute("open", "");
    await expect(page.locator("#catalog-filters")).toBeHidden();
    await page.locator(".filter-toggle").click();
    await expect(page.locator(".position-browser")).not.toHaveAttribute("open", "");
    await expect(page.locator("#catalog-filters")).toBeVisible();
    await expect(page.locator(".filter-toggle")).toHaveAccessibleName("Filters (2)");
    await expect(page.locator("#catalog-category")).toHaveValue("Acrobatic & supported");
    await expect(page.locator("#catalog-status")).toHaveValue("authored-3d");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await audit(page);
    await snapshot(page, info, `full-width-filters-${width}.png`);
  }
});

test("choice menus keep their heading and highlight visible without scrolling the panel", async ({ page }, info) => {
  for (const [width, height] of [[1080, 768], [390, 844], [320, 390]]) {
    await page.setViewportSize({ width, height });
    if (width <= 900) await page.locator('[data-region="library"]').click();
    if (await page.locator("#catalog-filters").isHidden()) await page.locator(".filter-toggle").click();
    const category = page.getByLabel("Category", { exact: true });
    await category.click();
    const menu = page.getByRole("listbox", { name: "Options for Category", exact: true });
    await expect(menu).toBeInViewport({ ratio: 1 });
    const scroll = await page.evaluate(() =>
      ["#library", ".library-top"].map((selector) => document.querySelector(selector).scrollTop));
    for (const key of ["End", "Home", "PageDown", "PageUp", "End"]) {
      await page.keyboard.press(key);
      await expect(menu.locator(".select-menu-heading")).toBeInViewport({ ratio: 1 });
      await expect(menu.locator(".highlighted")).toBeInViewport({ ratio: 1 });
      const headingBox = await menu.locator(".select-menu-heading").boundingBox();
      const highlightedBox = await menu.locator(".highlighted").boundingBox();
      expect(highlightedBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height);
      expect(await page.evaluate(() =>
        ["#library", ".library-top"].map((selector) => document.querySelector(selector).scrollTop))).toEqual(scroll);
    }
    await expect(menu.locator(".select-menu-heading")).toHaveText("Category");
    await audit(page);
    await snapshot(page, info, `filter-menu-${width}.png`);
    await page.keyboard.press("Escape");
    await expect(category).toHaveValue("all");
    await category.click();
    await menu.getByRole("option", { name: "Together", exact: true }).click();
    await expect(category).toHaveValue("Together");
    await expect(category.locator("..").locator(".select-value")).toHaveText("Together");
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
    await expect(category).toHaveValue("all");
  }
});

test("information icons show explanatory prose and follow live contact/placement state", async ({ page }, info) => {
  const contact = page.getByRole("button", { name: "Information about Partner contacts", exact: true });
  await expect(contact).toHaveText("");
  await expect(contact.locator(".ui-icon")).toHaveCount(1);
  await expect(page.locator("#contact-editor > p.hint")).toHaveCount(0);
  await expect(page.locator(".contact-help")).toHaveCount(0);
  await contact.click();
  const hint = page.getByRole("tooltip");
  await expect(hint).toContainText("Add a second figure");
  await expect(hint).toContainText("Choose which parts should meet.");
  await expect(hint).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const key of ["Enter", "Space"]) {
    await page.keyboard.press("Escape");
    await expect(hint).toBeHidden();
    await contact.press(key);
    await expect(hint).toContainText("Choose which parts should meet.");
  }
  await audit(page);
  await page.mouse.move(700, 500);
  await expect(hint).toBeHidden({ timeout: 1000 });
  await page.locator(".library-info").hover();
  await expect(hint).toContainText("1,283 source-linked 3D positions");
  await expect(hint).toContainText("not cloud storage");
  await expect(hint).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.getByRole("button", { name: "+ Add figure", exact: true }).click();
  await ready(page);
  await page.getByRole("button", { name: "Scene", exact: true }).click();
  await contact.click();
  await expect(hint).toContainText("The arrangement supplies its own contacts.");
  await page.getByLabel("Contact behavior", { exact: true }).selectOption("custom");
  await ready(page);
  await contact.click();
  await expect(hint).toContainText("Only the contacts below influence the pose.");
  await expect(page.locator(".contact-defaults")).toBeHidden();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.locator(".actor-card").first().getByText("Placement", { exact: true }).click();
  const placement = page.locator(".actor-card").first()
    .getByRole("button", { name: "Information about Placement", exact: true });
  await placement.focus();
  await expect(hint).toContainText("World position and XYZ rotation.");
  await expect(page.locator(".placement-editor > p.hint")).toHaveCount(2);
  await expect(page.locator(".placement-editor output")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.locator(".actor-card").first().getByText("Joints", { exact: true }).click();
  await page.locator(".actor-card").first()
    .getByRole("button", { name: "Information about Keep edited angles", exact: true }).click();
  await expect(hint).toContainText("Keeps specified angle channels fixed.");
  await expect(page.locator(".solved-joints").first()).toBeVisible();
  await audit(page);
  await snapshot(page, info, "panel-information-icons.png");
});

test("composition and dress-code information follow fixed, guided and setting changes", async ({ page }) => {
  const composition = page.getByRole("button", { name: "Information about Composition", exact: true });
  const hint = page.getByRole("tooltip");
  await expect(composition).toBeHidden();
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.getByText("Placement", { exact: true }).click();
  await page.getByLabel("Keep placement", { exact: true }).check();
  await ready(page);
  await page.getByRole("button", { name: "Scene", exact: true }).click();
  await composition.click();
  await expect(hint).toContainText("1 figure keeps fixed placement.");
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.getByRole("button", { name: "Use solved pose as guide", exact: true }).click();
  await ready(page);
  await page.getByRole("button", { name: "Scene", exact: true }).click();
  await composition.click();
  await expect(hint).toContainText("1 figure uses guided starting placement.");
  await expect(hint).not.toContainText("keeps fixed placement");
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.getByRole("button", { name: "Reset placement", exact: true }).click();
  await ready(page);
  await page.getByRole("button", { name: "Scene", exact: true }).click();
  await expect(composition).toBeHidden();
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.getByText("Appearance", { exact: true }).click();
  const dress = page.getByRole("button", { name: "Information about Dress for the setting", exact: true });
  await expect(dress).toBeHidden();
  await page.locator(".display-options > summary").click();
  await page.getByLabel("Setting", { exact: true }).selectOption("beach");
  await ready(page);
  await dress.click();
  await expect(hint).toHaveText("Swimwear on the beach, in place of the clothes below.");
  await page.locator(".display-options > summary").click();
  await page.getByLabel("Setting", { exact: true }).selectOption("pool");
  await ready(page);
  await dress.click();
  await expect(hint).toHaveText("Swimwear by the pool, in place of the clothes below.");
  await expect(page.getByLabel("Dress for the setting", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Outfit", { exact: true })).toBeDisabled();
});

test.describe("touch information hints", () => {
  test.use({ hasTouch: true });
  test("an ordinary tap on i reveals information without changing the scene, including Chinese", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.locator('[data-region="edit"]').tap();
    const info = page.getByRole("button", { name: "Information about Partner contacts", exact: true });
    const before = await page.locator("#scene-title").textContent();
    await info.tap();
    await expect(page.getByRole("tooltip")).toContainText("Add a second figure");
    await expect(page.getByRole("tooltip")).toBeInViewport({ ratio: 1 });
    await page.locator(".inspector-tabs [aria-controls='scene-controls']").tap();
    await expect(page.getByRole("tooltip")).toBeHidden();
    await expect(page.locator("#scene-title")).toHaveText(before);
    await page.goto("/?preset=builtin.standing-female&lang=zh");
    await expect(page.locator("#status")).toContainText("就绪", { timeout: 60_000 });
    await page.locator('[data-region="edit"]').tap();
    await page.getByRole("button", { name: "关于伴侣接触的信息", exact: true }).tap();
    await expect(page.getByRole("tooltip")).toContainText("选择");
    await expect(page.getByRole("tooltip")).toBeInViewport({ ratio: 1 });
    await audit(page);
  });
});
