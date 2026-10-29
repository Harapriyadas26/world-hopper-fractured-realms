# World Hopper: Fractured Realms

An original browser-based, keyboard-controlled 3D adventure prototype. Four connected realms, twelve shards, seal puzzles, four weapons, leveling, consumables, checkpoints, local saves, a three-stage Guardian encounter and core-restoration ending.

## Run

Requires Node.js 22.12+ (developed on Node 24).

```sh
npm ci
npm run dev
```

Open the local Vite URL. Use a desktop browser with WebGL / hardware acceleration enabled. No account, backend, pointer lock or mouse is required.

```sh
npm test
npx playwright install chromium
npx playwright test
npm run build
```

Vitest covers game-state rules. Playwright covers real keyboard input and render initialization; the second browser test uses encounter-placement fixtures to check later-realm interactions without repeatedly walking the entire route. It is not a complete human playthrough or a difficulty certification. Screenshots are in `tests/screenshots/`.

## Controls

WASD move · arrows rotate camera (up/down adjust height) · Space jump · Shift sprint · Left Ctrl dash · J light / K heavy · 1–4 equip · Q shield · R ultimate · T Reality Shift · E interact · F collect · H health potion · Tab inventory · Esc pause/back · Enter confirm.

Menus: Up/Down select and Enter confirm. Character name can be reached with Tab and edited normally. Inventory: Up/Down and Enter. Settings cycle via Enter. Camera rotation changes movement orientation.

## Adventure route

Each of the first three realms has four green/cyan/orange floating shards. Approach and press F. The two ringed seals at (-9,-17) and (9,-29) require E, then the altar at (0,-35). Four shards plus the altar open the northern portal at (0,-49). A western treasure cache at (-14,-12) provides three health potions plus the five other consumables. Each realm entry and completed altar is a checkpoint. Crossing the river cut requires the central bridge; Cyber's platform moves. The final bridge requires T. Final seals must also be activated while shifted. Once the altar awakens the Guardian, dodge the warning ring and strike during recovery. After defeating it, approach the floating Core and press E.

A health potion restores 40 HP. Mega heals fully; shield reduces damage 70%; speed/damage last 15 seconds; life crystals restore a lost life to a cap of 3. Ineffective health/life use keeps the item. Inventory is capped at 9 each. Progress saves after milestones and periodically. Continue restores at the saved checkpoint, not the exact walking position. Exhausted lives and completed victories clear that adventure. Starting a new adventure replaces the save after confirming Begin Adventure.

## Architecture

- `src/game/config.ts`: realm palettes, placements, weapons and XP thresholds.
- `src/game/store.ts`: versioned persistence and game rules.
- `src/game/Actors.tsx`: input, movement, combat, hazards and Guardian.
- `src/game/World.tsx`: original procedural scenery and interactables.
- `src/game/Crossing.tsx`: physical bridges and moving/reality platform.
- `src/game/Hopper.tsx`: articulated procedural character and weapon geometry.
- `src/game/materials.ts`: locally generated stone texture.
- `src/main.tsx`, `src/style.css`: scene composition and keyboard UI.

## Deploy

Run `npm ci && npm run build`, then publish the **contents of `dist/`** with any HTTPS static host. No API keys or backend required. On Netlify use build `npm run build` and publish directory `dist`; on Vercel choose Vite and output `dist`. No deployment has been performed. WebAssembly must be served correctly (`application/wasm` for separate wasm assets). The Rapier runtime is bundled. All game assets are local or generated; no runtime asset hotlinks are used.

## Scope

This is a functional prototype, **not the completed premium game in the master specification**. See `IMPLEMENTATION_REPORT.md` for verified results and specific missing requirements. Art, animations, combat variety, environmental design, audio and encounter balance need substantial production work before a release.
