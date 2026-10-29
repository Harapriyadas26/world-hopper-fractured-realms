import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { Float } from "@react-three/drei";
import { Hopper } from "./Hopper";
import { useGame, enemyId, levelFor } from "./store";
import { enemyPositions, distance, realms, type Vec } from "./config";
export const keys = new Set<string>();
const targets = new Map<string, { pos: Vec; hit: (n: number) => void }>();
let attackAt = 0;
let audioContext: AudioContext | undefined;
export function tone(freq = 440, duration = 0.12) {
  const s = useGame.getState();
  if (s.muted) return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    const o = audioContext.createOscillator(),
      g = audioContext.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      freq * 0.5,
      audioContext.currentTime + duration,
    );
    g.gain.setValueAtTime(s.volume * 0.12, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration,
    );
    o.connect(g).connect(audioContext.destination);
    o.start();
    o.stop(audioContext.currentTime + duration);
  } catch {}
}
function strike(heavy = false, ultimate = false) {
  const s = useGame.getState(),
    now = Date.now();
  if (!ultimate && now - attackAt < (heavy ? 650 : 320)) return;
  attackAt = now;
  tone(heavy ? 170 : 520);
  const range = ultimate
    ? 16
    : s.weapon === 1
      ? 21
      : s.weapon === 2
        ? 4.7
        : 3.8;
  let hits = 0;
  for (const t of [...targets.values()].sort(
    (a, b) => distance(a.pos, s.pos) - distance(b.pos, s.pos),
  )) {
    if (distance(s.pos, t.pos) < range) {
      t.hit(
        (ultimate ? 100 : heavy ? 40 : 22) * (now < s.damageUntil ? 1.6 : 1),
      );
      hits++;
      if (s.weapon === 1 && !ultimate) break;
    }
  }
  if (!hits)
    s.notify(
      s.weapon === 1
        ? "Plasma fired · move within 21m of an enemy"
        : "Attack · close the distance to your target",
    );
}
export function Input() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const s = useGame.getState();
      if (
        (e.code === "Tab" && ["playing", "inventory"].includes(s.mode)) ||
        [
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "ControlLeft",
          "ShiftLeft",
        ].includes(e.code)
      )
        e.preventDefault();
      keys.add(e.code);
      if (e.repeat) return;
      if (e.code === "Escape") {
        s.setMode(
          s.mode === "playing"
            ? "paused"
            : s.mode === "paused" || s.mode === "inventory"
              ? "playing"
              : "menu",
        );
        return;
      }
      if (e.code === "Tab" && ["playing", "inventory"].includes(s.mode)) {
        s.setMode(s.mode === "playing" ? "inventory" : "playing");
        return;
      }
      if (s.mode !== "playing") return;
      if (e.code === "KeyF") s.collect();
      if (e.code === "KeyE") s.interact();
      if (e.code === "KeyH") s.usePotion(0);
      if (/^Digit[1-4]$/.test(e.code)) s.equip(Number(e.code.slice(-1)) - 1);
      if (e.code === "KeyJ") strike();
      if (e.code === "KeyK") strike(true);
      if (e.code === "KeyR" && s.ability(e.code)) strike(false, true);
      if (["KeyQ", "KeyT"].includes(e.code)) s.ability(e.code);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {
      keys.clear();
      const s = useGame.getState();
      if (s.mode === "playing") {
        s.save();
        s.setMode("paused");
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      keys.clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return null;
}
export function Player() {
  const revision = useGame((s) => s.revision);
  return <PlayerBody key={revision} />;
}
function PlayerBody() {
  const body = useRef<RapierRigidBody>(null!);
  const model = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const [moving, setMoving] = useState(false);
  const [swing, setSwing] = useState(0);
  const weapon = useGame((s) => s.weapon);
  const d = useGame((s) => s.data);
  const yaw = useRef(0),
    height = useRef(7),
    jumps = useRef(0),
    jumpHeld = useRef(false),
    dashHeld = useRef(false),
    dashTime = useRef(0),
    grounded = useRef(false);
  const move = new THREE.Vector3();
  const look = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const lastSave = useRef(0);
  useFrame((_, dt) => {
    const s = useGame.getState();
    setSwing(attackAt);
    dt = Math.min(dt, 0.05);
    if (!body.current) return;
    const p = body.current.translation();
    if (s.mode === "playing") {
      const onGround = p.y < 0.97 && Math.abs(body.current.linvel().y) < 0.3;
      if (onGround) jumps.current = 0;
      grounded.current = onGround;
      if (keys.has("ArrowLeft")) yaw.current += dt * 1.5;
      if (keys.has("ArrowRight")) yaw.current -= dt * 1.5;
      if (keys.has("ArrowUp"))
        height.current = Math.max(3, height.current - dt * 4);
      if (keys.has("ArrowDown"))
        height.current = Math.min(12, height.current + dt * 4);
      const x = Number(keys.has("KeyD")) - Number(keys.has("KeyA")),
        z = Number(keys.has("KeyS")) - Number(keys.has("KeyW"));
      move
        .set(x, 0, z)
        .normalize()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      const isMoving = x !== 0 || z !== 0;
      setMoving((prev) => (prev === isMoving ? prev : isMoving));
      if (
        keys.has("ControlLeft") &&
        !dashHeld.current &&
        s.ability("ControlLeft")
      )
        dashTime.current = Date.now() + 200;
      dashHeld.current = keys.has("ControlLeft");
      const speed =
        (Date.now() < dashTime.current ? 19 : keys.has("ShiftLeft") ? 8 : 5) *
        (Date.now() < s.speedUntil ? 1.5 : 1);
      const v = body.current.linvel();
      body.current.setLinvel(
        {
          x: THREE.MathUtils.damp(v.x, move.x * speed, 12, dt),
          y: v.y,
          z: THREE.MathUtils.damp(v.z, move.z * speed, 12, dt),
        },
        true,
      );
      if (
        keys.has("Space") &&
        !jumpHeld.current &&
        (onGround || (levelFor(s.data.xp) >= 2 && jumps.current < 2))
      ) {
        body.current.setLinvel({ x: v.x, y: 7, z: v.z }, true);
        jumps.current++;
        tone(340);
      }
      jumpHeld.current = keys.has("Space");
      if (isMoving)
        model.current.rotation.y = THREE.MathUtils.damp(
          model.current.rotation.y,
          Math.atan2(-move.x, -move.z),
          15,
          dt,
        );
      if (p.y < -5 || Math.abs(p.x) > 22 || p.z < -57 || p.z > 20) {
        s.damage(100);
        return;
      }
      s.setPos([p.x, p.y, p.z]);
      if (Date.now() - lastSave.current > 10000) {
        s.save();
        lastSave.current = Date.now();
      }
    }
    desired.set(
      p.x + Math.sin(yaw.current) * 10,
      p.y + height.current,
      p.z + Math.cos(yaw.current) * 10,
    );
    camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
    look.set(p.x, p.y + 1.2, p.z - 2);
    camera.lookAt(look);
  });
  return (
    <RigidBody
      ref={body}
      position={useGame.getState().pos}
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={0.2}
      linearDamping={0.3}
      name="player"
    >
      <CapsuleCollider args={[0.45, 0.35]} />
      <group ref={model} position={[0, -0.8, 0]}>
        <Hopper
          moving={moving}
          attack={swing}
          weapon={weapon}
          character={d.character}
          outfit={d.outfit}
        />
      </group>
    </RigidBody>
  );
}
export function Enemy({ index }: { index: number }) {
  const r = useGame((s) => s.data.realm),
    cleared = useGame((s) => s.data.cleared.includes(enemyId(r, index)));
  const group = useRef<THREE.Group>(null!);
  const warn = useRef<THREE.Mesh>(null!);
  const [hp, setHp] = useState(65 + r * 20);
  const health = useRef(hp);
  const pos = useRef<Vec>([...enemyPositions[index]]);
  const hitAt = useRef(0),
    windup = useRef(0),
    stun = useRef(0);
  const id = enemyId(r, index);
  const flyer = index % 2 === 1;
  const color = realms[r].color;
  useEffect(() => {
    if (cleared) return;
    const target = {
      pos: pos.current,
      hit: (n: number) => {
        if (Date.now() - stun.current < 130) return;
        stun.current = Date.now();
        health.current -= n;
        setHp(health.current);
        tone(140);
        if (health.current <= 0) {
          useGame.getState().hitEnemy(id);
          targets.delete(id);
        }
      },
    };
    targets.set(id, target);
    return () => {
      targets.delete(id);
    };
  }, [id, cleared]);
  useFrame(({ clock }, dt) => {
    if (cleared || !group.current) return;
    const s = useGame.getState(),
      p = pos.current,
      now = Date.now();
    const dist = distance(p, s.pos);
    if (
      s.mode === "playing" &&
      dist < 12 &&
      dist > 2.2 &&
      now - stun.current > 400
    ) {
      const speed = (flyer ? 2.8 : 1.8) * Math.min(dt, 0.05);
      p[0] += ((s.pos[0] - p[0]) / dist) * speed;
      p[2] += ((s.pos[2] - p[2]) / dist) * speed;
    }
    if (s.mode === "playing" && dist < 3 && now - hitAt.current > 2400) {
      if (!windup.current) windup.current = now;
      if (now - windup.current > 850) {
        if (dist < 3 && s.pos[1] < 2.5) s.damage(12 + r * 4);
        hitAt.current = now;
        windup.current = 0;
      }
    } else if (dist >= 3) windup.current = 0;
    warn.current.visible = windup.current > 0;
    group.current.position.set(
      p[0],
      flyer ? 1 + Math.sin(clock.elapsedTime * 3) * 0.25 : 0.1,
      p[2],
    );
    group.current.lookAt(s.pos[0], group.current.position.y, s.pos[2]);
    group.current.scale.setScalar(
      windup.current ? 1 + Math.sin(clock.elapsedTime * 18) * 0.07 : 1,
    );
  });
  if (cleared) return null;
  return (
    <group ref={group}>
      <mesh
        ref={warn}
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[1.4, 1.6, 24]} />
        <meshBasicMaterial
          color="#ff633e"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <dodecahedronGeometry args={[flyer ? 0.65 : 0.85, 0]} />
        <meshStandardMaterial
          color={
            Date.now() - stun.current < 200
              ? "#ffffff"
              : r === 0
                ? "#68705c"
                : "#514c65"
          }
          roughness={0.7}
        />
      </mesh>
      <mesh position={[0, 1.4, 0.45]}>
        <boxGeometry args={[0.5, 0.12, 0.15]} />
        <meshStandardMaterial
          color={windup.current ? "#ff573d" : color}
          emissive={windup.current ? "#ff573d" : color}
          emissiveIntensity={2}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh
            position={[s * 0.8, flyer ? 0.9 : 0.4, 0]}
            rotation={[0, 0, s * 0.5]}
            castShadow
          >
            <boxGeometry
              args={[flyer ? 1.2 : 0.3, flyer ? 0.12 : 0.85, 0.32]}
            />
            <meshStandardMaterial color="#78776c" />
          </mesh>
        </group>
      ))}
      {hp < 65 + r * 20 && (
        <mesh position={[0, 2, 0]} scale={[hp / (65 + r * 20), 1, 1]}>
          <boxGeometry args={[1.5, 0.09, 0.1]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}
export function Boss() {
  const d = useGame((s) => s.data),
    group = useRef<THREE.Group>(null!),
    warning = useRef<THREE.Mesh>(null!);
  const phase = d.bossHp > 480 ? 1 : d.bossHp > 240 ? 2 : 3;
  const cycle = useRef(0);
  const vulnerable = useRef(true);
  const active = d.puzzles.includes("3:altar") && !d.bossDefeated;
  useEffect(() => {
    if (!active) return;
    targets.set("boss", {
      pos: [0, 0, -43],
      hit: (n) => {
        if (vulnerable.current) useGame.getState().bossDamage(n);
        else
          useGame
            .getState()
            .notify("Guardian charging · evade the marked zone");
      },
    });
    return () => {
      targets.delete("boss");
    };
  }, [active]);
  useFrame(({ clock }, dt) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(clock.elapsedTime) * 0.1;
    group.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.025;
    if (!active || useGame.getState().mode !== "playing") return;
    cycle.current += Math.min(dt, 0.05);
    const duration = phase === 1 ? 5 : phase === 2 ? 4.5 : 4;
    const t = cycle.current % duration;
    vulnerable.current = t > 1.4;
    warning.current.visible = t < 1.4;
    warning.current.scale.setScalar(phase === 1 ? 6 : phase === 2 ? 9 : 12);
    if (cycle.current >= duration) {
      cycle.current = 0;
      const s = useGame.getState();
      if (
        distance(s.pos, [0, 0, -43]) <
          (phase === 1 ? 6 : phase === 2 ? 9 : 12) &&
        s.pos[1] < 2.3
      )
        s.damage(phase === 3 ? 30 : 22);
      tone(65, 0.4);
    }
  });
  if (d.bossDefeated) return null;
  return (
    <>
      <group ref={group} position={[0, 0, -43]}>
        <mesh position={[0, 3, 0]} castShadow>
          <dodecahedronGeometry args={[1.9, 0]} />
          <meshStandardMaterial
            color="#727273"
            metalness={0.45}
            roughness={0.55}
          />
        </mesh>
        <Float speed={3}>
          <mesh position={[0, 3, -1.5]}>
            <octahedronGeometry args={[0.8]} />
            <meshStandardMaterial
              color="#ffa36b"
              emissive="#ff7c39"
              emissiveIntensity={2}
            />
          </mesh>
        </Float>
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[1.6, 1.2, 1.4]} />
          <meshStandardMaterial color="#92958c" />
        </mesh>
        <mesh position={[0, 5, -0.73]}>
          <boxGeometry args={[1, 0.18, 0.1]} />
          <meshStandardMaterial
            color="#8effef"
            emissive="#68ffe7"
            emissiveIntensity={3}
          />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh
              position={[s * 2.2, 2.8, 0]}
              rotation={[0, 0, s * 0.2]}
              castShadow
            >
              <capsuleGeometry args={[0.55, 2.3, 4, 6]} />
              <meshStandardMaterial color="#6d6e72" />
            </mesh>
            <mesh position={[s * 0.95, 0.9, 0]} castShadow>
              <boxGeometry args={[1.1, 1.8, 1.2]} />
              <meshStandardMaterial color="#666b69" />
            </mesh>
          </group>
        ))}
      </group>
      <mesh
        ref={warning}
        position={[0, 0.22, -43]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.85, 1, 48]} />
        <meshBasicMaterial
          color={phase === 1 ? "#ffdf82" : phase === 2 ? "#64d9ff" : "#ff5832"}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
export function Hazards() {
  const r = useGame((s) => s.data.realm);
  const ref = useRef<THREE.Group>(null!);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const on = Math.sin(clock.elapsedTime * 1.5) > 0.4;
    ref.current.visible = on;
    if (!on || useGame.getState().mode !== "playing") return;
    const s = useGame.getState();
    if (
      Date.now() - last.current > 1500 &&
      [-9, -24, -38].some((z) => Math.abs(s.pos[2] - z) < 0.7) &&
      Math.abs(s.pos[0]) < 4 &&
      s.pos[1] < 2
    ) {
      s.damage(r === 1 ? 12 : 18);
      last.current = Date.now();
    }
  });
  if (r !== 1 && r !== 2) return null;
  return (
    <group ref={ref}>
      {[-9, -24, -38].map((z) => (
        <mesh key={z} position={[0, r === 1 ? 1 : 0.15, z]}>
          <boxGeometry args={[7, r === 1 ? 0.12 : 0.3, 0.4]} />
          <meshStandardMaterial
            color={r === 1 ? "#ff6ad9" : "#ff7d29"}
            emissive={r === 1 ? "#ff47d4" : "#ff5522"}
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
}

export function CombatEffects() {
  const slash = useRef<THREE.Mesh>(null!),
    beam = useRef<THREE.Mesh>(null!),
    shield = useRef<THREE.Mesh>(null!);
  const origin = new THREE.Vector3(),
    end = new THREE.Vector3(),
    direction = new THREE.Vector3();
  useFrame(() => {
    const s = useGame.getState(),
      age = (Date.now() - attackAt) / 1000;
    slash.current.visible = s.mode === "playing" && s.weapon !== 1 && age < 0.3;
    slash.current.position.set(s.pos[0], s.pos[1] + 0.1, s.pos[2]);
    slash.current.rotation.set(-Math.PI / 2, 0, age * 12);
    slash.current.scale.setScalar(0.7 + age * 6);
    shield.current.visible = Date.now() < s.shieldUntil;
    shield.current.position.set(s.pos[0], s.pos[1] + 0.3, s.pos[2]);
    beam.current.visible = false;
    if (s.weapon === 1 && age < 0.18 && s.mode === "playing") {
      const nearest = [...targets.values()]
        .filter((t) => distance(t.pos, s.pos) < 21)
        .sort((a, b) => distance(a.pos, s.pos) - distance(b.pos, s.pos))[0];
      if (nearest) {
        origin.set(s.pos[0], s.pos[1] + 0.7, s.pos[2]);
        end.set(nearest.pos[0], nearest.pos[1] + 1, nearest.pos[2]);
        direction.subVectors(end, origin);
        beam.current.position.copy(origin).add(end).multiplyScalar(0.5);
        beam.current.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize(),
        );
        beam.current.scale.set(1, direction.length(), 1);
        beam.current.visible = true;
      }
    }
  });
  return (
    <>
      <mesh ref={slash} visible={false}>
        <torusGeometry args={[1, 0.055, 4, 24, Math.PI * 1.3]} />
        <meshBasicMaterial color="#b6fff1" transparent opacity={0.8} />
      </mesh>
      <mesh ref={beam} visible={false}>
        <cylinderGeometry args={[0.07, 0.07, 1, 6]} />
        <meshBasicMaterial color="#6ff4ff" />
      </mesh>
      <mesh ref={shield} visible={false}>
        <sphereGeometry args={[1.4, 16, 12]} />
        <meshBasicMaterial
          color="#7ecbff"
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
    </>
  );
}
