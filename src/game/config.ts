export type Vec = [number, number, number];
export const realms = [
  {
    name: "The Verdant Sanctum",
    short: "Jungle Temple",
    eyebrow: "I · ANCIENT JUNGLE TEMPLE",
    color: "#b6e877",
    accent: "#d9bc76",
    fog: "#173a32",
    sky: "#163931",
    ground: "#314639",
    enemy: ["Stone Guardian", "Giant Spider"],
    weapon: "Ancient Crystal Sword",
    puzzle: "Stand on both sun seals, then awaken the temple altar.",
    hint: "Follow the river. Four shards awaken the eastern gate.",
  },
  {
    name: "City Above Tomorrow",
    short: "Cyber City",
    eyebrow: "II · CYBER CITY",
    color: "#68e9ff",
    accent: "#c189ff",
    fog: "#131d3e",
    sky: "#101b38",
    ground: "#202d45",
    enemy: ["Security Robot", "Flying Drone"],
    weapon: "Plasma Blaster",
    puzzle: "Activate the two relays, then disable the shield at the terminal.",
    hint: "Time your crossing between the pulsing laser fields.",
  },
  {
    name: "The Ember Dominion",
    short: "Volcano Realm",
    eyebrow: "III · VOLCANO REALM",
    color: "#ffb064",
    accent: "#ff663e",
    fog: "#3d2024",
    sky: "#291923",
    ground: "#3d3035",
    enemy: ["Lava Creature", "Fire Bat"],
    weapon: "Lava Hammer",
    puzzle: "Quench both forge seals, then unlock the obsidian gate.",
    hint: "Watch for glowing eruption circles before crossing.",
  },
  {
    name: "Where Worlds Collide",
    short: "World Collision",
    eyebrow: "IV · WORLD COLLISION",
    color: "#d0aeff",
    accent: "#73f4ec",
    fog: "#24233e",
    sky: "#1a1930",
    ground: "#39364c",
    enemy: ["Fractured Sentinel", "Rift Wraith"],
    weapon: "Reality Blade",
    puzzle: "Shift reality with T and activate both fractured seals.",
    hint: "Restore the seals, defeat the Guardian, and awaken the Core.",
  },
];
export const shardPositions: Vec[] = [
  [-10, 1.4, 2],
  [10, 1.4, -12],
  [-11, 2, -25],
  [8, 1.4, -39],
];
export const seals: Vec[] = [
  [-9, 0, -17],
  [9, 0, -29],
];
export const enemyPositions: Vec[] = [
  [-7, 0, -6],
  [9, 0, -19],
  [-9, 0, -32],
  [5, 0, -43],
];
export const weapons = [
  "Ancient Crystal Sword",
  "Plasma Blaster",
  "Lava Hammer",
  "Reality Blade",
];
export const skills = [
  "Wayfarer",
  "Double Jump",
  "Energy Shield",
  "Elemental Dash",
  "Reality Strike",
];
export const thresholds = [0, 100, 260, 480, 760];
export const potionNames = [
  "Health Potion",
  "Mega Health Potion",
  "Shield Potion",
  "Speed Potion",
  "Damage Potion",
  "Life Crystal",
];
export const distance = (a: Vec, b: Vec) =>
  Math.hypot(a[0] - b[0], a[2] - b[2]);
