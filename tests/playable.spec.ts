import { test, expect } from "@playwright/test";
test("keyboard menus, canvas, movement, shard pickup, inventory and save restoration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "world-hopper-settings",
      JSON.stringify({ quality: "Low", volume: 0, muted: true }),
    ),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "WORLD HOPPER FRACTURED REALMS" }),
  ).toBeVisible();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: "tests/screenshots/title.png" });
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "A traveler. A new beginning." }),
  ).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4000);
  await expect(page.locator("canvas")).toBeVisible();
  const state = () =>
    page.evaluate(async () => {
      const { useGame } = await import("/src/game/store.ts" as string);
      return { pos: useGame.getState().pos, data: useGame.getState().data };
    });
  const before = await state();
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () => (await state()).pos[2], {
      timeout: 30000,
      intervals: [100],
    })
    .toBeLessThan(2.5);
  await page.keyboard.up("KeyW");
  const after = await state();
  expect(after.pos[2]).toBeLessThan(before.pos[2] - 5);
  await page.keyboard.down("KeyA");
  await expect
    .poll(async () => (await state()).pos[0], {
      timeout: 30000,
      intervals: [100],
    })
    .toBeLessThan(-9);
  await page.keyboard.up("KeyA");
  await page.keyboard.press("KeyF");
  await page.waitForTimeout(300);
  const collected = await state();
  expect(collected.data.shards.length).toBe(1);
  await page.screenshot({ path: "tests/screenshots/jungle.png" });
  await page.keyboard.press("Tab");
  await expect(page.getByText("TRAVELER'S FIELD GUIDE")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Adventure paused." }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.reload();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: /Continue Adventure/ }).click();
  await expect(page.getByText("◇ 1 / 12 WORLD SHARDS")).toBeVisible();
  expect(errors).toEqual([]);
});

test("render every realm and complete interaction gates, boss combat, core and victory with keyboard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "world-hopper-settings",
      JSON.stringify({ quality: "Low", volume: 0, muted: true }),
    ),
  );
  await page.goto("/");
  await page.waitForTimeout(5000);
  // Fixtures place the player at encounters. Combat and interactions still use real key events.
  const place = async (realm: number, pos: [number, number, number]) =>
    page.evaluate(
      async ({ realm, pos }) => {
        const { useGame } = await import("/src/game/store.ts" as string);
        const s = useGame.getState();
        useGame.setState({
          data: {
            ...s.data,
            realm,
            xp: 900,
            checkpoint: pos,
            potions: [9, 1, 1, 1, 1, 1],
          },
          pos,
          weapon: realm,
          mode: "playing",
          revision: s.revision + 1,
        });
      },
      { realm, pos },
    );
  for (let r = 0; r < 3; r++) {
    await place(r, [-10, 1, 2]);
    await page.waitForTimeout(1000);
    await page.keyboard.press("KeyF");
    for (const p of [
      [10, 1, -12],
      [-11, 2, -25],
      [8, 1, -39],
    ]) {
      await place(r, p as [number, number, number]);
      await page.waitForTimeout(400);
      await page.keyboard.press("KeyF");
    }
    for (const p of [
      [-9, 1, -17],
      [9, 1, -29],
      [0, 1, -35],
    ]) {
      await place(r, p as [number, number, number]);
      await page.waitForTimeout(400);
      await page.keyboard.press("KeyE");
    }
    await place(r, [0, 1, -46]);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `tests/screenshots/realm-${r + 1}.png` });
    await page.keyboard.press("KeyE");
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const { useGame } = await import("/src/game/store.ts" as string);
          return useGame.getState().data.realm;
        }),
      )
      .toBe(r + 1);
  }
  await place(3, [-9, 1, -17]);
  await page.waitForTimeout(500);
  await page.keyboard.press("KeyT");
  await page.keyboard.press("KeyE");
  await place(3, [9, 1, -29]);
  await page.waitForTimeout(500);
  await page.keyboard.press("KeyE");
  await place(3, [0, 1, -35]);
  await page.waitForTimeout(500);
  await page.keyboard.press("KeyE");
  await expect(
    page.getByText("THE WORLD GUARDIAN · ANCIENT FURY"),
  ).toBeVisible();
  await page.screenshot({ path: "tests/screenshots/realm-4.png" });
  await place(3, [0, 1, -40]);
  await page.keyboard.press("KeyQ");
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("KeyK");
    await page.waitForTimeout(700);
    await page.keyboard.press("KeyH");
  }
  await expect(page.getByText("Restore the World Core · E")).toBeVisible({
    timeout: 15000,
  });
  await place(3, [0, 1, -47]);
  await page.waitForTimeout(500);
  await page.keyboard.press("KeyE");
  await expect(
    page.getByRole("heading", { name: "Four worlds. One reality." }),
  ).toBeVisible();
  await page.screenshot({ path: "tests/screenshots/victory.png" });
  expect(errors).toEqual([]);
});
