import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ready } from "./helpers/ready.js";
import { openLibraryFilters } from "./helpers/library.js";

test.use({ hasTouch: true });

async function snapshot(page, info, name) {
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  ));
  await page.screenshot({ path: info.outputPath(name) });
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?preset=builtin.standing-female");
  await ready(page);
});
test.afterEach(() => expect(errors).toEqual([]));

test("custom menus support pointer, keyboard, cancellation, typeahead and scene synchronization", async ({ page }) => {
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  const body = page.getByLabel("Body type", { exact: true });
  const value = body.locator("..").locator(".select-value");
  await expect(value).toHaveText("female");
  await body.click();
  await expect(body).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("listbox", { name: "Options for Body type", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("option", { name: "female", exact: true })).toHaveAttribute("aria-selected", "true");
  await menu.getByRole("option", { name: "male", exact: true }).click();
  await ready(page);
  await expect(body).toHaveValue("male");
  await expect(value).toHaveText("male");
  await expect(body).toBeFocused();
  await expect(menu).toBeHidden();
  await page.locator("#undo").click();
  await ready(page);
  await expect(value).toHaveText("female");
  await body.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.press("Escape");
  await expect(body).toHaveValue("female");
  await expect(body).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await page.keyboard.press("m");
  await page.keyboard.press("Enter");
  await ready(page);
  await expect(value).toHaveText("male");
  await page.keyboard.press("Space");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await ready(page);
  await expect(value).toHaveText("female");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(menu).toBeHidden();
  await expect(body).toHaveValue("female");
  await body.focus();
  await page.keyboard.press("F4");
  await page.keyboard.press("PageDown");
  await expect(body).toHaveValue("female");
  await menu.focus();
  await page.keyboard.press("/");
  await expect(menu).toBeVisible();
  await expect(page.getByLabel("Search positions")).not.toBeFocused();
  await page.keyboard.press("Escape");
  await expect(body).toBeFocused();
  await body.click();
  await page.getByRole("button", { name: "Scene", exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Scene", exact: true })).toBeFocused();
});

test("filters update their custom labels and menus remain accessible above clipped panels", async ({ page }) => {
  await openLibraryFilters(page);
  const category = page.getByLabel("Category", { exact: true });
  await category.click();
  const menu = page.getByRole("listbox", { name: "Options for Category", exact: true });
  await expect(menu).toBeInViewport({ ratio: 1 });
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await menu.getByRole("option", { name: "Together", exact: true }).click();
  await expect(category.locator("..").locator(".select-value")).toHaveText("Together");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(category.locator("..").locator(".select-value")).toHaveText("All categories");
  await category.click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#catalog-filters")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#catalog-filters")).toBeHidden();
});

test("dynamic options, disabled choices, rebuilt controls and modal selects use the same menu", async ({ page }) => {
  await page.getByRole("button", { name: "Figures", exact: true }).click();
  await page.getByText("Appearance", { exact: true }).click();
  const outfit = page.getByLabel("Outfit", { exact: true });
  await outfit.click();
  const menu = page.getByRole("listbox", { name: "Options for Outfit", exact: true });
  const mixed = menu.getByRole("option", { name: "Mixed", exact: true });
  await expect(mixed).toHaveAttribute("aria-disabled", "true");
  await mixed.click({ force: true });
  await expect(outfit).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("End");
  await expect(outfit).not.toHaveAttribute("aria-activedescendant", await mixed.getAttribute("id"));
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "+ Add figure", exact: true }).click();
  await ready(page);
  await expect(page.locator(".actor-card select:not(.select-input)")).toHaveCount(0);
  await page.getByRole("button", { name: "Remove figure", exact: true }).last().click();
  await ready(page);
  await expect(page.locator(".actor-card")).toHaveCount(1);
  await page.locator(".display-options > summary").click();
  await page.getByLabel("Setting", { exact: true }).click();
  await page.getByRole("listbox", { name: "Options for Setting", exact: true })
    .getByRole("option", { name: "Beach", exact: true }).click();
  await ready(page);
  await expect(outfit).toBeDisabled();
  await expect(outfit.locator("..")).toHaveClass(/disabled/);
  await page.locator("#open-export").click();
  const resolution = page.getByRole("dialog").getByRole("combobox");
  await resolution.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.getByRole("listbox").getByRole("option", { name: /^4/ }).click();
  await expect(resolution).toHaveValue("4");
  await expect(page.getByRole("dialog")).toBeVisible();
  await resolution.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".select-menu:popover-open")).toHaveCount(0);
});

test("display disclosure and custom menus fit touch screens and localized text", async ({ page }) => {
  for (const [width, height] of [[390, 700], [320, 700], [844, 390], [320, 390]]) {
    await page.setViewportSize({ width, height });
    await page.locator('[data-region="studio"]').click();
    await page.locator(".display-options").evaluate((node) => { node.open = false; });
    await page.locator(".display-options > summary").click();
    const setting = page.getByLabel("Setting", { exact: true });
    await setting.tap();
    const menu = page.getByRole("listbox", { name: "Options for Setting", exact: true });
    await expect(menu).toBeInViewport({ ratio: 1 });
    await menu.getByRole("option", { name: "Hotel suite", exact: true }).click();
    await expect(setting.locator("..").locator(".select-value")).toHaveText("Hotel suite");
    await page.keyboard.press("Escape");
    await expect(page.locator(".display-options")).not.toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.goto("/?preset=builtin.standing-female&lang=zh");
  await expect(page.locator("#status")).toContainText("就绪", { timeout: 60_000 });
  await page.getByText("显示", { exact: true }).click();
  const setting = page.getByLabel("布景", { exact: true });
  await setting.click();
  await page.getByRole("listbox", { name: "布景的选项", exact: true })
    .getByRole("option", { name: "摄影棚", exact: true }).click();
  await expect(setting.locator("..").locator(".select-value")).toHaveText("摄影棚");
});

test.describe("first visit", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("the scene gets the full window and reopening panels retains compact borderless controls", async ({ page }, info) => {
    await expect(page.locator("#library")).toBeHidden();
    await expect(page.locator("#panel")).toBeHidden();
    await expect(page.locator(".display-options-body")).toBeHidden();
    const canvas = await page.locator("#viewport").boundingBox();
    expect(canvas.width).toBe(1440);
    expect(canvas.height).toBe(1000);
    await page.locator("#toggle-library").click();
    await page.locator("#toggle-inspector").click();
    const metrics = await page.evaluate(() => {
      const width = document.querySelector("#viewport").getBoundingClientRect().width;
      return {
        ratio: width / innerWidth,
        header: document.querySelector(".topbar").getBoundingClientRect().height,
        borders: ["#library", "#panel", ".drawer-toggle", ".stage-toolbar", ".custom-select"]
          .map((selector) => getComputedStyle(document.querySelector(selector)).borderTopWidth),
      };
    });
    expect(metrics.ratio).toBeGreaterThan(0.58);
    expect(metrics.header).toBe(48);
    expect(metrics.borders).toEqual(["0px", "0px", "0px", "0px", "0px"]);
    await snapshot(page, info, "borderless-desktop.png");
    await page.locator("#toggle-library").click();
    await page.locator("#toggle-inspector").click();
    await snapshot(page, info, "scene-first-desktop.png");
    await page.reload();
    await ready(page);
    await expect(page.locator("#library")).toBeHidden();
    await expect(page.locator("#panel")).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.locator("#viewport").boundingBox();
    expect(mobile.height / 844).toBeGreaterThan(0.88);
    await snapshot(page, info, "scene-first-mobile.png");
  });
});
