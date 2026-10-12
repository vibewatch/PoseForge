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

test("panels and square catalog rows meet the viewport edges without bottom gaps", async ({ page }, info) => {
  for (const width of [1440, 1080, 1600]) {
    await page.setViewportSize({ width, height: 1000 });
    const metrics = await page.evaluate(() => {
      const measure = (selector) => {
        const node = document.querySelector(selector);
        const rect = node.getBoundingClientRect();
        const css = getComputedStyle(node);
        return {
          left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
          radius: css.borderRadius, paddingBottom: css.paddingBottom,
        };
      };
      return ["#library", "#panel", ".catalog-list", ".preset-card", ".library-bottom"]
        .map(measure);
    });
    expect(metrics[0]).toMatchObject({ left: 0, top: 48, bottom: 1000, radius: "0px" });
    expect(metrics[1]).toMatchObject({ right: width, top: 48, bottom: 1000, radius: "0px", paddingBottom: "0px" });
    expect(metrics[2].paddingBottom).toBe("0px");
    expect(metrics[3]).toMatchObject({ left: 0, right: metrics[0].right, radius: "0px" });
    expect(metrics[4]).toMatchObject({ bottom: 1000, paddingBottom: "0px" });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".stage-toolbar")).toBeInViewport({ ratio: 1 });
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: info.outputPath("seamless-desktop.png") });
  await page.locator("#toggle-library").click();
  await expect(page.locator("#toggle-library")).toHaveAttribute("data-hint", "Show library");
  await page.locator("#toggle-library").click();
  await expect(page.locator("#toggle-library")).toHaveAttribute("data-hint", "Hide library");
});

test("custom hints support keyboard, hover transfer, dismissal, live updates and disabled controls", async ({ page }) => {
  const fit = page.locator("#fit-view");
  await fit.evaluate((node) => {
    const note = document.createElement("span");
    note.id = "existing-help";
    note.hidden = true;
    note.textContent = "Existing help";
    document.body.append(note);
    node.setAttribute("aria-describedby", note.id);
  });
  await fit.focus();
  const hint = page.getByRole("tooltip");
  await expect(hint).toHaveText("Fit figures (F)");
  await expect(fit).toHaveAttribute("aria-describedby", "existing-help poseforge-hint");
  await page.keyboard.press("Escape");
  await expect(hint).toBeHidden();
  await expect(fit).toBeFocused();
  await expect(fit).toHaveAttribute("aria-describedby", "existing-help");
  await fit.hover();
  // Escape remains dismissed until the pointer leaves the control.
  await expect(hint).toBeHidden();
  await page.mouse.move(700, 500);
  await fit.hover();
  await expect(hint).toHaveText("Fit figures (F)");
  await page.mouse.move(700, 500);
  await expect(hint).toBeHidden({ timeout: 1000 });
  await expect(fit).toBeFocused();
  await page.locator("#zoom-in").click();
  await expect(page.locator("#zoom-in")).toBeFocused();
  await page.mouse.move(700, 500);
  await page.locator("#zoom-in").hover();
  await expect(hint).toHaveText("Zoom in");
  await page.mouse.move(700, 500);
  await expect(hint).toBeHidden({ timeout: 1000 });
  await page.locator("#zoom-in").hover();
  await expect(hint).toHaveText("Zoom in");
  await hint.hover();
  await page.waitForTimeout(250);
  await expect(hint).toBeVisible();
  await page.locator("#zoom-in").evaluate((node) => { node.title = "Updated zoom hint"; });
  await expect(hint).toHaveText("Updated zoom hint");
  await expect(page.locator("#zoom-in")).not.toHaveAttribute("title");
  await page.locator("#zoom-in").evaluate((node) => { node.title = ""; });
  await expect(hint).toBeHidden();
  await page.locator("#undo").hover();
  await expect(hint).toHaveText("Undo (Ctrl/⌘ Z)");
  await expect(hint).toBeInViewport({ ratio: 1 });
  await page.mouse.move(700, 500);
  await expect(hint).toBeHidden();
  await expect(page.locator("body [title]")).toHaveCount(0);
});

test("hint descriptions coexist with dialogs, custom menus and accessible icon controls", async ({ page }) => {
  const names = ["3D", "Front", "Side", "Top", "Tour", "Zoom out", "Fit figures", "Zoom in"];
  for (const name of names) {
    const button = page.getByRole("button", { name, exact: true });
    await expect(button.locator(".ui-icon")).toHaveCount(1);
    await expect(button).toHaveText("");
  }
  await page.getByRole("button", { name: "Front", exact: true }).click();
  await expect(page.locator('[data-view="front"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.locator("#zoom-in").focus();
  await expect(page.getByRole("tooltip")).toHaveText("Zoom in");
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.locator("#open-export").click();
  const dialog = page.getByRole("dialog");
  const close = dialog.getByRole("button", { name: "Close dialog", exact: true });
  await close.evaluate((node) => { node.title = "Close export"; });
  await dialog.getByRole("combobox").focus();
  await close.focus();
  await expect(dialog.getByRole("tooltip")).toHaveText("Close export");
  await expect(page.getByRole("tooltip")).toBeInViewport({ ratio: 1 });
  const modalAudit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(modalAudit.violations).toEqual([]);
  await dialog.getByRole("combobox").click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("tooltip")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tooltip")).toBeHidden();
  await expect(page.locator("body [title]")).toHaveCount(0);
});

test.describe("touch controls", () => {
  test.use({ hasTouch: true });
  test("icon dock fits small screens; long presses show hints without triggering actions or blocking normal taps", async ({ page }, info) => {
    for (const [width, height] of [[320, 700], [390, 844], [481, 390], [520, 390], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.locator('[data-region="studio"]').click();
      await expect(page.locator(".stage-toolbar")).toBeInViewport({ ratio: 1 });
      const buttons = page.locator(".stage-toolbar .icon-control");
      for (const button of await buttons.all()) {
        const box = await button.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
        await expect(button).toBeInViewport({ ratio: 1 });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.locator('[data-region="library"]').click();
      const panel = await page.locator("#library").boundingBox();
      expect(panel).toMatchObject({ x: 0, y: 48, width, height: height - 92 });
      await page.locator('[data-region="edit"]').click();
      const inspector = await page.locator("#panel").boundingBox();
      expect(inspector).toMatchObject({ x: 0, y: 48, width, height: height - 92 });
    }
    await page.setViewportSize({ width: 320, height: 700 });
    await page.locator('[data-region="studio"]').click();
    const front = page.locator('[data-view="front"]');
    const box = await front.boundingBox();
    const session = await page.context().newCDPSession(page);
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await expect(page.getByRole("tooltip")).toHaveText("Front");
    await expect(page.getByRole("tooltip")).toBeInViewport({ ratio: 1 });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(front).toHaveAttribute("aria-pressed", "false");
    await front.tap();
    await expect(front).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("tooltip")).toBeHidden();
    await page.locator('[data-region="library"]').tap();
    const list = page.locator(".catalog-list");
    const listBox = await list.boundingBox();
    const swipe = { x: listBox.x + 100, y: listBox.y + listBox.height - 30 };
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [swipe] });
    for (let step = 1; step <= 6; step++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove", touchPoints: [{ x: swipe.x, y: swipe.y - step * 20 }],
      });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect(page.getByRole("tooltip")).toBeHidden();
    await page.locator('[data-region="studio"]').click();
    await expect(page.locator("#app")).toHaveAttribute("data-mobile", "studio");
    await expect(page.locator("#scene-title")).toHaveText("Standing · female");
    await session.detach();
    await page.evaluate(() => new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: info.outputPath("icon-dock-mobile.png") });
  });
});

test("Chinese icon names and dynamic custom hints stay localized", async ({ page }) => {
  await page.goto("/?preset=builtin.standing-female&lang=zh");
  await expect(page.locator("#status")).toContainText("就绪", { timeout: 60_000 });
  await expect(page.locator("#save-preset")).toHaveAccessibleName("保存预设");
  await expect(page.locator("#save-preset .ui-icon")).toHaveCount(1);
  await page.locator("#language").focus();
  await expect(page.getByRole("tooltip")).toHaveText("切换到英文");
  await expect(page.locator(".display-options > summary")).toHaveAccessibleName("显示");
  await page.locator(".display-options > summary").click();
  await page.getByLabel("布景", { exact: true }).click();
  await expect(page.getByRole("listbox", { name: "布景的选项", exact: true })).toBeVisible();
  await expect(page.getByRole("tooltip")).toBeHidden();
  await expect(page.locator("body [title]")).toHaveCount(0);
});
