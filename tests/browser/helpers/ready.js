import { expect } from "@playwright/test";

/** Cold model shaping plus exact contact checks can exceed 30 seconds on
 * shared software-rendering hosts. This only bounds scene completion;
 * geometry assertions and the separate cache-work checks remain unchanged. */
export async function ready(page) {
  await expect(page.locator("#status")).toContainText("Ready", {
    timeout: 60_000,
  });
  await expect(page.locator("#save-preset")).toBeEnabled();
}

export async function openSceneInformation(page) {
  const information = page.locator("#scene-information");
  if (!(await information.evaluate((node) => node.open)))
    await page.locator("#scene-information-toggle").click();
}
