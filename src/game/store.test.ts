import { beforeEach, describe, it, expect, vi } from "vitest";
import { useGame, levelFor, readSave } from "./store";
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
});
const s = () => useGame.getState();
beforeEach(() => {
  storage.clear();
  s().start();
  s().setMode("playing");
});
describe("adventure critical path", () => {
  it("starts with prescribed stats and no potions", () => {
    expect(s().data.hp).toBe(100);
    expect(s().data.lives).toBe(3);
    expect(s().data.potions).toEqual([0, 0, 0, 0, 0, 0]);
    expect(levelFor(s().data.xp)).toBe(1);
  });
  it("gates portals on both puzzle and four shards and reaches final victory", () => {
    for (let r = 0; r < 3; r++) {
      s().setPos([0, 1, -49]);
      s().interact();
      expect(s().data.realm).toBe(r);
      for (const p of [
        [-10, 1, 2],
        [10, 1, -12],
        [-11, 2, -25],
        [8, 1, -39],
      ]) {
        s().setPos(p as [number, number, number]);
        s().collect();
        s().collect();
      }
      expect(s().data.shards.length).toBe((r + 1) * 4);
      for (const p of [
        [-9, 0, -17],
        [9, 0, -29],
        [0, 0, -35],
      ]) {
        s().setPos(p as [number, number, number]);
        s().interact();
      }
      s().setPos([0, 1, -49]);
      s().interact();
      expect(s().data.realm).toBe(r + 1);
      expect(s().weapon).toBe(r + 1);
    }
    expect(s().data.shards.length).toBe(12);
    s().setPos([-9, 0, -17]);
    s().interact();
    expect(s().data.puzzles).not.toContain("3:seal0");
    expect(s().ability("KeyT")).toBe(true);
    for (const p of [
      [-9, 0, -17],
      [9, 0, -29],
      [0, 0, -35],
    ]) {
      s().setPos(p as [number, number, number]);
      s().interact();
    }
    s().bossDamage(720);
    expect(s().data.bossDefeated).toBe(true);
    s().setPos([0, 0, -48]);
    s().interact();
    expect(s().mode).toBe("victory");
    expect(readSave()).toBeNull();
  });
  it("does not consume ineffective healing or life items; caps healing", () => {
    s().setPos([-14, 0, -12]);
    s().interact();
    expect(s().data.potions[0]).toBe(3);
    s().usePotion(0);
    expect(s().data.potions[0]).toBe(3);
    s().damage(20);
    s().usePotion(0);
    expect(s().data.hp).toBe(100);
    expect(s().data.potions[0]).toBe(2);
    s().usePotion(5);
    expect(s().data.potions[5]).toBe(1);
  });
  it("handles three deaths, respawns, and invalidates exhausted saves", () => {
    s().damage(100);
    expect(s().data.lives).toBe(2);
    expect(s().pos).toEqual([0, 1, 12]);
    expect(s().data.hp).toBe(100);
    s().damage(100);
    s().damage(100);
    expect(s().mode).toBe("dead");
    expect(readSave()).toBeNull();
  });
  it("persists and restores checkpoint, character, shard and inventory", () => {
    s().setCharacter(1, 2, "Nova");
    s().setPos([-10, 1, 2]);
    s().collect();
    s().setPos([-14, 0, -12]);
    s().interact();
    const expected = s().data;
    s().save();
    s().start();
    s().resume();
    expect(s().data).toEqual(expected);
    expect(s().pos).toEqual(expected.checkpoint);
  });
  it("rejects corrupt saves", () => {
    storage.set("world-hopper-v1", "{broken");
    expect(readSave()).toBeNull();
    storage.set(
      "world-hopper-v1",
      JSON.stringify({ ...s().data, potions: [999] }),
    );
    expect(readSave()).toBeNull();
  });
  it("awards each enemy once and enforces unlocks and cooldowns", () => {
    s().hitEnemy("0:enemy0");
    s().hitEnemy("0:enemy0");
    expect(s().data.xp).toBe(45);
    s().equip(3);
    expect(s().weapon).toBe(0);
    expect(s().ability("KeyQ")).toBe(false);
    useGame.setState({ data: { ...s().data, xp: 760 } });
    expect(levelFor(s().data.xp)).toBe(5);
    expect(s().ability("KeyQ")).toBe(true);
    expect(s().ability("KeyQ")).toBe(false);
    s().damage(10);
    expect(s().data.hp).toBe(97);
  });
});
