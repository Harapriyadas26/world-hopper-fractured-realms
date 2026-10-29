import { create } from "zustand";
import {
  distance,
  realms,
  shardPositions,
  seals,
  enemyPositions,
  thresholds,
  weapons,
  type Vec,
} from "./config";
export type Mode =
  | "menu"
  | "character"
  | "intro"
  | "playing"
  | "paused"
  | "inventory"
  | "settings"
  | "controls"
  | "credits"
  | "dead"
  | "victory";
export interface Save {
  version: 1;
  realm: number;
  hp: number;
  lives: number;
  xp: number;
  shards: string[];
  cleared: string[];
  puzzles: string[];
  chests: string[];
  checkpoint: Vec;
  potions: number[];
  character: number;
  outfit: number;
  name: string;
  bossHp: number;
  bossDefeated: boolean;
}
const fresh = (): Save => ({
  version: 1,
  realm: 0,
  hp: 100,
  lives: 3,
  xp: 0,
  shards: [],
  cleared: [],
  puzzles: [],
  chests: [],
  checkpoint: [0, 1, 12],
  potions: [0, 0, 0, 0, 0, 0],
  character: 0,
  outfit: 0,
  name: "Aerin",
  bossHp: 720,
  bossDefeated: false,
});
export const levelFor = (xp: number) =>
  thresholds.filter((t) => xp >= t).length;
export function readSave(): Save | null {
  try {
    const s = JSON.parse(localStorage.getItem("world-hopper-v1") || "null");
    if (
      !s ||
      s.version !== 1 ||
      !Number.isInteger(s.realm) ||
      s.realm < 0 ||
      s.realm > 3 ||
      ![s.hp, s.lives, s.xp, s.bossHp].every(Number.isFinite) ||
      s.hp <= 0 ||
      s.hp > 100 ||
      s.lives < 1 ||
      s.lives > 3 ||
      !Array.isArray(s.checkpoint) ||
      s.checkpoint.length !== 3 ||
      !s.checkpoint.every(Number.isFinite) ||
      !Array.isArray(s.potions) ||
      s.potions.length !== 6 ||
      !s.potions.every(
        (n: number) => Number.isInteger(n) && n >= 0 && n <= 9,
      ) ||
      !["shards", "cleared", "puzzles", "chests"].every(
        (k) =>
          Array.isArray(s[k]) &&
          s[k].every((v: unknown) => typeof v === "string"),
      )
    )
      return null;
    return { ...fresh(), ...s };
  } catch {
    return null;
  }
}
interface Game {
  data: Save;
  mode: Mode;
  pos: Vec;
  weapon: number;
  notice: string;
  noticeAt: number;
  revision: number;
  transition: number;
  shieldUntil: number;
  speedUntil: number;
  damageUntil: number;
  shiftUntil: number;
  dashUntil: number;
  skillUntil: number;
  ultimateUntil: number;
  shiftReady: number;
  volume: number;
  quality: string;
  muted: boolean;
  setMode: (m: Mode) => void;
  notify: (s: string) => void;
  start: () => void;
  resume: () => void;
  save: () => void;
  setCharacter: (c: number, o: number, n: string) => void;
  setPos: (p: Vec) => void;
  collect: () => void;
  interact: () => void;
  damage: (n: number) => void;
  hitEnemy: (id: string) => void;
  bossDamage: (n: number) => void;
  usePotion: (i: number) => void;
  ability: (key: string) => boolean;
  equip: (i: number) => void;
  setting: (k: string, v: unknown) => void;
}
export const useGame = create<Game>((set, get) => ({
  data: fresh(),
  mode: "menu",
  pos: [0, 1, 12],
  weapon: 0,
  notice: "",
  noticeAt: 0,
  revision: 0,
  transition: 0,
  shieldUntil: 0,
  speedUntil: 0,
  damageUntil: 0,
  shiftUntil: 0,
  dashUntil: 0,
  skillUntil: 0,
  ultimateUntil: 0,
  shiftReady: 0,
  volume: 0.35,
  quality: "High",
  muted: false,
  setMode: (mode) => set({ mode }),
  notify: (notice) => set({ notice, noticeAt: Date.now() }),
  start: () => {
    const old = get().data;
    set({
      data: {
        ...fresh(),
        character: old.character,
        outfit: old.outfit,
        name: old.name,
      },
      mode: "intro",
      pos: [0, 1, 12],
      weapon: 0,
      revision: get().revision + 1,
      shieldUntil: 0,
      speedUntil: 0,
      damageUntil: 0,
      shiftUntil: 0,
      dashUntil: 0,
      skillUntil: 0,
      ultimateUntil: 0,
      shiftReady: 0,
    });
  },
  resume: () => {
    const s = readSave();
    if (s)
      set({
        data: s,
        pos: s.checkpoint,
        weapon: s.realm,
        mode: "playing",
        revision: get().revision + 1,
      });
    else get().notify("No valid saved adventure found.");
  },
  save: () => {
    try {
      localStorage.setItem("world-hopper-v1", JSON.stringify(get().data));
    } catch {
      get().notify("Save unavailable. Browser storage is full or disabled.");
    }
  },
  setCharacter: (character, outfit, name) =>
    set((s) => ({
      data: {
        ...s.data,
        character,
        outfit,
        name: name.slice(0, 18) || "Aerin",
      },
    })),
  setPos: (pos) => set({ pos }),
  collect: () => {
    const { data: d, pos } = get();
    const i = shardPositions.findIndex(
      (p, i) => distance(p, pos) < 2.8 && !d.shards.includes(`${d.realm}:${i}`),
    );
    if (d.realm < 3 && i >= 0) {
      const xp = d.xp + 40;
      set({ data: { ...d, xp, shards: [...d.shards, `${d.realm}:${i}`] } });
      get().notify(
        levelFor(xp) > levelFor(d.xp)
          ? `Level ${levelFor(xp)} · ${["", "Wayfarer", "Double Jump", "Energy Shield", "Elemental Dash", "Reality Strike"][levelFor(xp)]} unlocked!`
          : "World Shard recovered · +40 XP",
      );
      get().save();
    } else get().notify("Move close to a glowing shard and press F.");
  },
  interact: () => {
    const { data: d, pos, shiftUntil } = get();
    const r = d.realm;
    const seal = seals.findIndex((p) => distance(pos, p) < 3);
    if (seal >= 0 && !d.puzzles.includes(`${r}:seal${seal}`)) {
      if (r === 3 && Date.now() > shiftUntil) {
        get().notify("Press T to reveal this seal in shifted reality.");
        return;
      }
      set({
        data: {
          ...d,
          puzzles: [...d.puzzles, `${r}:seal${seal}`],
          xp: d.xp + 35,
        },
      });
      get().notify("Seal attuned · +35 XP");
      get().save();
      return;
    }
    if (distance(pos, [0, 0, -35]) < 3 && !d.puzzles.includes(`${r}:altar`)) {
      if (seals.some((_, i) => !d.puzzles.includes(`${r}:seal${i}`))) {
        get().notify("Attune both marked seals first.");
        return;
      }
      set({
        data: {
          ...d,
          puzzles: [...d.puzzles, `${r}:altar`],
          xp: d.xp + 60,
          checkpoint: [0, 1, -35],
        },
      });
      get().notify(
        r === 3
          ? "Reality restored · Guardian awakened"
          : "Puzzle complete · checkpoint activated",
      );
      get().save();
      return;
    }
    if (distance(pos, [-14, 0, -12]) < 3 && !d.chests.includes(`${r}:chest`)) {
      set({
        data: {
          ...d,
          chests: [...d.chests, `${r}:chest`],
          xp: d.xp + 30,
          potions: d.potions.map((n, i) => Math.min(9, n + (i === 0 ? 3 : 1))),
        },
      });
      get().notify("Secret cache · potions and life crystal · +30 XP");
      get().save();
      return;
    }
    if (r === 3 && distance(pos, [0, 0, -48]) < 5 && d.bossDefeated) {
      set({ mode: "victory" });
      try {
        localStorage.removeItem("world-hopper-v1");
      } catch {}
      return;
    }
    if (r < 3 && distance(pos, [0, 0, -49]) < 4) {
      if (
        d.shards.filter((s) => s.startsWith(`${r}:`)).length < 4 ||
        !d.puzzles.includes(`${r}:altar`)
      ) {
        get().notify(
          "Portal sealed · recover 4 shards and complete the altar.",
        );
        return;
      }
      const next = r + 1;
      set({
        data: {
          ...d,
          realm: next,
          xp: d.xp + 70,
          checkpoint: [0, 1, 12],
          hp: 100,
        },
        pos: [0, 1, 12],
        weapon: next,
        revision: get().revision + 1,
        transition: Date.now(),
      });
      get().notify(`${realms[next].short} · ${weapons[next]} unlocked`);
      get().save();
      return;
    }
    get().notify("E · seals, altar, treasure chest, or portal");
  },
  damage: (n) => {
    if (get().mode !== "playing") return;
    const s = get();
    const hp = Math.max(
      0,
      s.data.hp - n * (Date.now() < s.shieldUntil ? 0.3 : 1),
    );
    if (hp > 0) {
      set({ data: { ...s.data, hp } });
      return;
    }
    const lives = s.data.lives - 1;
    set({
      data: {
        ...s.data,
        hp: lives > 0 ? 100 : 0,
        lives,
        bossHp: s.data.bossDefeated ? 0 : 720,
      },
      pos: s.data.checkpoint,
      revision: s.revision + 1,
      mode: lives > 0 ? "playing" : "dead",
    });
    get().notify("A life lost · returned to checkpoint");
    if (lives > 0) get().save();
    else
      try {
        localStorage.removeItem("world-hopper-v1");
      } catch {}
  },
  hitEnemy: (id) => {
    const d = get().data;
    if (d.cleared.includes(id)) return;
    const xp = d.xp + 45;
    set({ data: { ...d, cleared: [...d.cleared, id], xp } });
    get().notify(
      levelFor(xp) > levelFor(d.xp)
        ? `Level ${levelFor(xp)} · new ability unlocked`
        : "Enemy defeated · +45 XP",
    );
    get().save();
  },
  bossDamage: (n) => {
    const d = get().data;
    if (d.bossDefeated || !d.puzzles.includes("3:altar")) return;
    const bossHp = Math.max(0, d.bossHp - n);
    set({
      data: {
        ...d,
        bossHp,
        bossDefeated: bossHp === 0,
        xp: d.xp + (bossHp === 0 ? 200 : 0),
      },
    });
    if (bossHp === 0) {
      get().notify("Guardian defeated · approach the World Core and press E");
      get().save();
    }
  },
  usePotion: (i) => {
    const s = get(),
      d = s.data;
    if (!["playing", "inventory"].includes(s.mode) || d.potions[i] <= 0) return;
    if ((i < 2 && d.hp >= 100) || (i === 5 && d.lives >= 3)) {
      s.notify("Already at maximum. Item kept.");
      return;
    }
    set({
      data: {
        ...d,
        potions: d.potions.map((n, j) => (j === i ? n - 1 : n)),
        hp: i === 0 ? Math.min(100, d.hp + 40) : i === 1 ? 100 : d.hp,
        lives: i === 5 ? Math.min(3, d.lives + 1) : d.lives,
      },
      ...(i === 2 ? { shieldUntil: Date.now() + 15000 } : {}),
      ...(i === 3 ? { speedUntil: Date.now() + 15000 } : {}),
      ...(i === 4 ? { damageUntil: Date.now() + 15000 } : {}),
    });
    s.notify("Potion used");
    get().save();
  },
  ability: (key) => {
    const s = get(),
      now = Date.now(),
      level = levelFor(s.data.xp);
    if (s.mode !== "playing") return false;
    if (key === "ControlLeft" && now > s.dashUntil) {
      set({ dashUntil: now + 2400 });
      return true;
    }
    if (key === "KeyQ" && level >= 3 && now > s.skillUntil) {
      set({ skillUntil: now + 18000, shieldUntil: now + 5000 });
      s.notify("Energy Shield · 5 seconds");
      return true;
    }
    if (key === "KeyR" && level >= 5 && now > s.ultimateUntil) {
      set({ ultimateUntil: now + 30000 });
      return true;
    }
    if (key === "KeyT" && s.data.realm === 3 && now > s.shiftReady) {
      set({ shiftUntil: now + 10000, shiftReady: now + 16000 });
      s.notify("Reality Shift · seals revealed for 10 seconds");
      return true;
    }
    return false;
  },
  equip: (i) => {
    if (i <= get().data.realm) set({ weapon: i });
  },
  setting: (k, v) => {
    if (["volume", "quality", "muted"].includes(k)) {
      set({ [k]: v } as Partial<Game>);
      try {
        localStorage.setItem(
          "world-hopper-settings",
          JSON.stringify({
            volume: get().volume,
            quality: get().quality,
            muted: get().muted,
          }),
        );
      } catch {}
    }
  },
}));
try {
  const s = JSON.parse(localStorage.getItem("world-hopper-settings") || "null");
  if (s)
    useGame.setState({
      volume:
        typeof s.volume === "number"
          ? Math.min(1, Math.max(0, s.volume))
          : 0.35,
      quality: ["Low", "Medium", "High"].includes(s.quality)
        ? s.quality
        : "High",
      muted: s.muted === true,
    });
} catch {}
export const enemyId = (r: number, i: number) => `${r}:enemy${i}`;
export { enemyPositions };
