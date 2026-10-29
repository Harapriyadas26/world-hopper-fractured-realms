import React, { Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useProgress } from "@react-three/drei";
import { World } from "./game/World";
import {
  Player,
  Enemy,
  Boss,
  Hazards,
  Input,
  tone,
  CombatEffects,
} from "./game/Actors";
import { Hopper } from "./game/Hopper";
import { useGame, readSave, levelFor } from "./game/store";
import {
  potionNames,
  realms,
  skills,
  thresholds,
  weapons,
} from "./game/config";
import "./style.css";
import { useShallow } from "zustand/react/shallow";
function MenuCamera() {
  useFrame(({ camera, clock }) => {
    camera.position.set(12 + Math.sin(clock.elapsedTime * 0.07) * 2, 7.5, -29);
    camera.lookAt(0, 3, -49);
  });
  return null;
}
function Loader() {
  const { progress } = useProgress();
  return (
    <div className="loading">
      <span className="sigil">◇</span>
      <p>WEAVING REALITY</p>
      <small>{Math.round(progress)}%</small>
    </div>
  );
}
function Scene() {
  const mode = useGame((s) => s.mode),
    r = useGame((s) => s.data.realm),
    rev = useGame((s) => s.revision),
    quality = useGame((s) => s.quality);
  const menu = [
    "menu",
    "character",
    "credits",
    "controls",
    "settings",
    "intro",
  ].includes(mode);
  return (
    <Canvas
      shadows={quality !== "Low"}
      dpr={quality === "Low" ? 1 : quality === "Medium" ? 1.25 : [1, 1.75]}
      camera={{ position: [12, 7, -29], fov: 52, near: 0.1, far: 160 }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <Physics paused={mode !== "playing"} gravity={[0, -20, 0]}>
          <World menu={menu} />
          {menu ? (
            <>
              <MenuCamera />
              {mode === "character" && (
                <group position={[0, 0, -43]} scale={2}>
                  <Hopper
                    character={useGame.getState().data.character}
                    outfit={useGame.getState().data.outfit}
                  />
                </group>
              )}
            </>
          ) : (
            <>
              <Player />
              <CombatEffects />
              <group key={`${r}:${rev}`}>
                {[0, 1, 2, 3].map((i) => (
                  <Enemy key={i} index={i} />
                ))}
                {r === 3 && <Boss />}
                <Hazards />
              </group>
            </>
          )}
        </Physics>
      </Suspense>
    </Canvas>
  );
}
function Menu({
  items,
  title,
  subtitle,
  back,
}: {
  items: {
    label: string;
    detail?: string;
    action: () => void;
    disabled?: boolean;
  }[];
  title?: string;
  subtitle?: string;
  back?: () => void;
}) {
  const [selected, select] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    refs.current[selected]?.focus();
  }, [selected]);
  return (
    <section
      className="panel"
      onKeyDown={(e) => {
        if (e.code === "ArrowDown" || e.code === "ArrowUp") {
          e.preventDefault();
          const dir = e.code === "ArrowDown" ? 1 : -1;
          let next = selected;
          for (let i = 0; i < items.length; i++) {
            next = (next + dir + items.length) % items.length;
            if (!items[next].disabled) break;
          }
          select(next);
          tone(300);
        }
        if (e.code === "Escape") back?.();
      }}
    >
      {title && <h2>{title}</h2>}
      {subtitle && <p className="muted">{subtitle}</p>}
      <nav>
        {items.map((item, i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            disabled={item.disabled}
            className={selected === i ? "selected" : ""}
            onFocus={() => select(i)}
            onClick={() => {
              tone();
              item.action();
            }}
          >
            <span className="menu-index">{String(i + 1).padStart(2, "0")}</span>
            <span>
              {item.label}
              {item.detail && <small>{item.detail}</small>}
            </span>
            <span className="arrow">↗</span>
          </button>
        ))}
      </nav>
      {back && (
        <button className="back" onClick={back}>
          ESC · Back
        </button>
      )}
    </section>
  );
}
const bindings = [
  ["W A S D", "Move"],
  ["↑ ↓ ← →", "Rotate camera / menu navigation"],
  ["SPACE", "Jump / double jump at level 2"],
  ["SHIFT / CTRL", "Sprint / dash"],
  ["J / K", "Light / heavy attack"],
  ["1 – 4", "Equip unlocked weapon"],
  ["Q / R", "Shield at level 3 / ultimate at level 5"],
  ["T", "Reality Shift in final realm"],
  ["E / F", "Interact / collect shard"],
  ["H", "Health potion"],
  ["TAB / ESC", "Inventory / pause"],
];
function UI() {
  const s = useGame(useShallow(({ pos, ...rest }) => rest));
  const d = s.data;
  const [inv, setInv] = useState(0);
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (s.mode === "intro") {
      const timer = setTimeout(() => {
        s.setMode("playing");
        s.notify(
          "WASD move · Arrows camera · F collect · E interact · Tab field guide",
        );
        s.save();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [s.mode]);
  const home = () => s.setMode("menu"),
    level = levelFor(d.xp),
    theme = realms[d.realm];
  const hud = ["playing", "paused", "inventory"].includes(s.mode);
  return (
    <div
      className="interface"
      style={
        { "--accent": hud ? theme.color : "#d9c28b" } as React.CSSProperties
      }
    >
      {!hud && (
        <header className="topline">
          <span>✧ &nbsp; A JOURNEY BEYOND REALITY</span>
          <span>WORLD HOPPER &nbsp; / &nbsp; CHAPTER 01—04</span>
        </header>
      )}
      {s.mode === "menu" && (
        <>
          <div className="hero">
            <div className="eyebrow">
              <i /> THE WORLD CORE HAS SHATTERED
            </div>
            <h1>
              WORLD
              <br />
              HOPPER<span>FRACTURED REALMS</span>
            </h1>
            <p>
              Four worlds. One fractured destiny.
              <br />
              Step through the unknown. Restore what remains.
            </p>
            <Menu
              items={[
                {
                  label: "Start Adventure",
                  detail: readSave()
                    ? "Start a new journey · replaces save"
                    : "Your journey begins in the jungle",
                  action: () => s.setMode("character"),
                },
                {
                  label: "Continue Adventure",
                  disabled: !readSave(),
                  action: s.resume,
                },
                {
                  label: "Character Selection",
                  action: () => s.setMode("character"),
                },
                { label: "Controls", action: () => s.setMode("controls") },
                { label: "Settings", action: () => s.setMode("settings") },
                { label: "Credits", action: () => s.setMode("credits") },
              ]}
            />
          </div>
          <aside className="realm-card">
            <span className="eyebrow">YOUR FIRST DESTINATION</span>
            <h3>The Verdant Sanctum</h3>
            <p>Ancient Jungle Temple</p>
            <div className="card-line" />
            <small>
              01 / 04 <span>EXPLORE THE FRACTURE &nbsp; ◇</span>
            </small>
          </aside>
        </>
      )}
      {s.mode === "character" && (
        <div className="hero secondary">
          <div className="eyebrow">CHOOSE YOUR WORLD HOPPER</div>
          <h2>
            A traveler.
            <br />A new beginning.
          </h2>
          <p>Different stories. The same extraordinary potential.</p>
          <label className="name">
            TRAVELER NAME
            <input
              aria-label="Traveler name"
              maxLength={18}
              value={d.name}
              onChange={(e) =>
                s.setCharacter(d.character, d.outfit, e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  document
                    .querySelector<HTMLButtonElement>(".panel button")
                    ?.focus();
                }
              }}
            />
          </label>
          <Menu
            items={[
              {
                label: d.character === 0 ? "◆ Male Hopper" : "◇ Male Hopper",
                action: () => s.setCharacter(0, d.outfit, d.name),
              },
              {
                label:
                  d.character === 1 ? "◆ Female Hopper" : "◇ Female Hopper",
                action: () => s.setCharacter(1, d.outfit, d.name),
              },
              {
                label: `Outfit · ${["Verdant", "Amethyst", "Ember"][d.outfit]}`,
                action: () =>
                  s.setCharacter(d.character, (d.outfit + 1) % 3, d.name),
              },
              {
                label: "Begin Adventure",
                detail: "A new adventure replaces your previous save",
                action: s.start,
              },
            ]}
            back={home}
          />
        </div>
      )}
      {s.mode === "intro" && (
        <div className="cinematic">
          <div className="eyebrow">THE FRACTURE · PROLOGUE</div>
          <h2>
            Reality remembers
            <br />
            what we have forgotten.
          </h2>
          <p>
            The Guardian has taken the World Core.
            <br />
            Recover twelve shards. Cross four realms. Bring the worlds home.
          </p>
          <button
            autoFocus
            onClick={() => {
              s.setMode("playing");
              s.save();
            }}
          >
            ENTER THE SANCTUM &nbsp; ↗
          </button>
        </div>
      )}
      {["controls", "credits", "settings"].includes(s.mode) && (
        <div className="modal-wrap">
          <div className="modal">
            <div className="eyebrow">WORLD HOPPER · FIELD GUIDE</div>
            {s.mode === "controls" ? (
              <>
                <h2>Master the journey.</h2>
                <div className="controls">
                  {bindings.map(([a, b]) => (
                    <div key={a}>
                      <kbd>{a}</kbd>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <p>
                  Golden rings mark seals. E attunes them, then the central
                  altar. Find four shards with F before entering each portal.
                  Treasure caches sit west of the route. Red windups warn of
                  enemy attacks: move or jump away.
                </p>
                <button autoFocus onClick={home}>
                  Return to title
                </button>
              </>
            ) : s.mode === "credits" ? (
              <>
                <h2>Beyond the fracture.</h2>
                <p>
                  An original procedural adventure. Geometry, character forms,
                  UI, and synthesized sound created for this project. Powered by
                  React, Three.js, React Three Fiber, Rapier, and Zustand.
                </p>
                <p>
                  Inspired by ancient exploration, neon skylines, and volcanic
                  fantasy. No reference artwork or protected game assets are
                  distributed.
                </p>
                <button autoFocus onClick={home}>
                  Return to title
                </button>
              </>
            ) : (
              <Menu
                title="Shape your world."
                items={[
                  {
                    label: `Sound · ${s.muted ? "Muted" : "On"}`,
                    action: () => s.setting("muted", !s.muted),
                  },
                  {
                    label: `Volume · ${Math.round(s.volume * 100)}%`,
                    action: () =>
                      s.setting(
                        "volume",
                        s.volume >= 0.99 ? 0 : Math.min(1, s.volume + 0.15),
                      ),
                  },
                  {
                    label: `Graphics · ${s.quality}`,
                    action: () =>
                      s.setting(
                        "quality",
                        s.quality === "High"
                          ? "Medium"
                          : s.quality === "Medium"
                            ? "Low"
                            : "High",
                      ),
                  },
                ]}
                back={home}
              />
            )}
          </div>
        </div>
      )}
      {hud && (
        <>
          <div className="hud-top">
            <div className="vitals">
              <div className="portrait">{d.character ? "♧" : "♤"}</div>
              <div>
                <div className="player-name">
                  {d.name}
                  <span>LV {level}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${d.hp}%` }} />
                </div>
                <small>
                  {Math.ceil(d.hp)} / 100 HP{" "}
                  <span>
                    {"◆".repeat(d.lives)}
                    {"◇".repeat(3 - d.lives)} &nbsp; LIVES
                  </span>
                </small>
                <div className="xp">
                  <i
                    style={{
                      width: `${level === 5 ? 100 : ((d.xp - thresholds[level - 1]) / (thresholds[level] - thresholds[level - 1])) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="location">
              <span className="eyebrow">{theme.eyebrow}</span>
              <h3>{theme.name}</h3>
              <small>◇ {d.shards.length} / 12 WORLD SHARDS</small>
            </div>
          </div>
          <div className="quest">
            <span className="eyebrow">THE PATH AHEAD</span>
            <p>
              {d.realm === 3
                ? d.bossDefeated
                  ? "Restore the World Core · E"
                  : d.puzzles.includes("3:altar")
                    ? "Defeat the World Guardian"
                    : "Shift reality · attune both seals and altar"
                : d.puzzles.includes(`${d.realm}:altar`) &&
                    d.shards.filter((x) => x.startsWith(`${d.realm}:`))
                      .length === 4
                  ? "Enter the awakened portal · E"
                  : `Recover shards ${d.shards.filter((x) => x.startsWith(`${d.realm}:`)).length}/4 · attune the two seals`}
            </p>
            <small>{theme.hint}</small>
          </div>
          {d.realm === 3 &&
            d.puzzles.includes("3:altar") &&
            !d.bossDefeated && (
              <div className="bossbar">
                <span>
                  THE WORLD GUARDIAN ·{" "}
                  {d.bossHp > 480
                    ? "ANCIENT FURY"
                    : d.bossHp > 240
                      ? "CYBER OVERLOAD"
                      : "VOLCANIC COLLAPSE"}
                </span>
                <div className="bar">
                  <i style={{ width: `${(d.bossHp / 720) * 100}%` }} />
                </div>
                <small>
                  Evade the expanding ring. Strike during the recovery window.
                </small>
              </div>
            )}
          <div className="hud-bottom">
            <div className="equipped">
              <span className="eyebrow">
                {String(s.weapon + 1).padStart(2, "0")} / EQUIPPED
              </span>
              <h3>{weapons[s.weapon]}</h3>
              <small>J Light &nbsp; K Heavy &nbsp; 1–4 Switch</small>
            </div>
            <div className="quickslots">
              {[
                ["CTRL", "Dash", s.dashUntil],
                ["Q", level >= 3 ? "Shield" : "Level 3", s.skillUntil],
                ["R", level >= 5 ? "Ultimate" : "Level 5", s.ultimateUntil],
                ["T", "Shift", s.shiftReady],
                ["H", `Potion ×${d.potions[0]}`, 0],
              ].map(([key, label, until]) => (
                <div key={key}>
                  <kbd>{key}</kbd>
                  <small>
                    {Number(until) > time
                      ? `${Math.ceil((Number(until) - time) / 1000)}s`
                      : label}
                  </small>
                </div>
              ))}
            </div>
            <div className="guide">
              <kbd>TAB</kbd> Field guide <br />
              <kbd>ESC</kbd> Pause
            </div>
          </div>
          <div className="crosshair">·</div>
          {s.notice && time - s.noticeAt < 4500 && (
            <div className="toast" key={s.noticeAt}>
              <span>✧</span>
              {s.notice}
            </div>
          )}
          {s.mode === "paused" && (
            <div className="modal-wrap">
              <div className="modal">
                <div className="eyebrow">A MOMENT BETWEEN WORLDS</div>
                <Menu
                  title="Adventure paused."
                  items={[
                    {
                      label: "Resume Adventure",
                      action: () => s.setMode("playing"),
                    },
                    {
                      label: "Save Adventure",
                      action: () => {
                        s.save();
                        s.notify("Adventure saved");
                        s.setMode("playing");
                      },
                    },
                    {
                      label: `Audio · ${s.muted ? "Muted" : "On"}`,
                      action: () => s.setting("muted", !s.muted),
                    },
                    {
                      label: "Save & Return to Title",
                      action: () => {
                        s.save();
                        home();
                      },
                    },
                  ]}
                />
              </div>
            </div>
          )}
          {s.mode === "inventory" && (
            <div className="modal-wrap">
              <div
                className="modal inventory"
                onKeyDown={(e) => {
                  if (e.code === "ArrowDown" || e.code === "ArrowUp") {
                    e.preventDefault();
                    setInv((inv + (e.code === "ArrowDown" ? 1 : 9)) % 10);
                  }
                  if (e.code === "Enter") {
                    e.preventDefault();
                    if (inv < 4) s.equip(inv);
                    else s.usePotion(inv - 4);
                  }
                }}
              >
                <div className="eyebrow">TRAVELER'S FIELD GUIDE</div>
                <h2>
                  {d.name} <small>Level {level}</small>
                </h2>
                <p>
                  {d.xp} XP · {d.shards.length}/12 shards · {skills[level - 1]}
                </p>
                <div className="inventory-grid">
                  {[...weapons, ...potionNames].map((name, i) => (
                    <button
                      key={name}
                      autoFocus={i === 0}
                      className={inv === i ? "selected" : ""}
                      onFocus={() => setInv(i)}
                      onClick={() => {
                        if (i < 4) s.equip(i);
                        else s.usePotion(i - 4);
                      }}
                    >
                      <span>
                        {i < 4 ? "⚔" : "◇"} &nbsp; {name}
                      </span>
                      <small>
                        {i < 4
                          ? i > d.realm
                            ? "Locked"
                            : i === s.weapon
                              ? "Equipped"
                              : `Equip · ${i === 1 ? "21m ranged" : "melee"}`
                          : `×${d.potions[i - 4]} · ${["+40 HP", "Full health", "70% protection · 15s", "Speed boost · 15s", "Damage boost · 15s", "+1 life"][i - 4]}`}
                      </small>
                    </button>
                  ))}
                </div>
                <p className="muted">
                  ↑ ↓ Select · Enter use/equip · Tab close
                  <br />
                  Level 2: double jump · Level 3: Q shield · Level 4: elemental
                  dash · Level 5: R strike
                </p>
                <button onClick={() => s.setMode("playing")}>
                  Return to adventure
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {["dead", "victory"].includes(s.mode) && (
        <div className="cinematic end">
          <div className="eyebrow">
            {s.mode === "victory"
              ? "THE CORE IS WHOLE AGAIN"
              : "YOUR JOURNEY ECHOES ON"}
          </div>
          <h2>
            {s.mode === "victory"
              ? "Four worlds.\nOne reality."
              : "Lost between worlds."}
          </h2>
          <p>
            {s.mode === "victory"
              ? `${d.name}, you have restored the World Core. The fractured realms are finally at peace.`
              : "Your final life has faded. A new journey awaits beyond the gate."}
          </p>
          <p>
            {d.shards.length} / 12 SHARDS &nbsp; · &nbsp; LEVEL {level} &nbsp; ·
            &nbsp; {d.xp} XP
          </p>
          <button autoFocus onClick={s.start}>
            Begin a new adventure ↗
          </button>
          <button onClick={home}>Return to title</button>
        </div>
      )}
      {!hud && (
        <footer>
          <span>
            ↑ ↓ NAVIGATE &nbsp; <kbd>ENTER</kbd> SELECT &nbsp; <kbd>ESC</kbd>{" "}
            BACK
          </span>
          <span>AN ORIGINAL FOUR-REALM ADVENTURE &nbsp; ✧</span>
        </footer>
      )}
      {time - s.transition < 1200 && <div className="transition" />}
    </div>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="loading">
        <h2>The renderer could not start.</h2>
        <p>Enable WebGL / hardware acceleration, then reload.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Scene />
    <Suspense fallback={<Loader />}>
      <Input />
    </Suspense>
    <UI />
  </ErrorBoundary>,
);
