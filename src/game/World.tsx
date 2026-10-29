import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { realms, shardPositions, seals, type Vec } from "./config";
import { useGame } from "./store";
import { useStoneTexture } from "./materials";
import { Crossing } from "./Crossing";
const rand = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
function Block({
  p,
  s,
  c = "#687363",
  rot = 0,
}: {
  p: Vec;
  s: Vec;
  c?: string;
  rot?: number;
}) {
  const map = useStoneTexture();
  return (
    <mesh position={p} rotation={[0, rot, 0]} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} map={map} roughness={0.92} />
    </mesh>
  );
}
function Pillar({ p, height = 7 }: { p: Vec; height?: number }) {
  return (
    <group position={p}>
      <Block p={[0, 0.22, 0]} s={[1.9, 0.44, 1.9]} />
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.66, height, 8]} />
        <meshStandardMaterial color="#7c8370" roughness={0.94} />
      </mesh>
      <Block p={[0, height, 0]} s={[1.6, 0.45, 1.6]} />
      {[1, 2, 3].map((i) => (
        <mesh key={i} position={[0, (height * i) / 4, 0]}>
          <torusGeometry args={[0.59, 0.07, 4, 8]} />
          <meshStandardMaterial color="#a4a185" />
        </mesh>
      ))}
    </group>
  );
}
function Tree({ p, seed }: { p: Vec; seed: number }) {
  const h = 7 + rand(seed) * 8;
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.9, h, 7]} />
        <meshStandardMaterial color="#49473a" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[(i - 1) * 1.1, h - i * 0.9, 0]}
          scale={[2.7, 1.3, 2.3]}
          castShadow
        >
          <icosahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial
            color={["#315b40", "#406b47", "#52794b"][i]}
            roughness={1}
          />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.9, h * 0.6, 0]}
          rotation={[0, 0, s * 0.45]}
        >
          <cylinderGeometry args={[0.13, 0.26, 3, 5]} />
          <meshStandardMaterial color="#49473a" />
        </mesh>
      ))}
    </group>
  );
}
function Crystal({
  p,
  color,
  scale = 1,
}: {
  p: Vec;
  color: string;
  scale?: number;
}) {
  return (
    <group position={p} scale={scale}>
      <mesh castShadow>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.65}
          metalness={0.4}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[0.65, 1, 0.3, 7]} />
        <meshStandardMaterial color="#596658" />
      </mesh>
    </group>
  );
}
function Portal({ r, open }: { r: number; open: boolean }) {
  const rings = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    rings.current.rotation.z += dt * 0.15;
  });
  const c = realms[r].color;
  return (
    <group position={[0, 3.5, -49]}>
      <Pillar p={[-3.3, -3.5, 0]} height={7} />
      <Pillar p={[3.3, -3.5, 0]} height={7} />
      <Block p={[0, 3.5, 0]} s={[8, 0.8, 1.5]} />
      <mesh>
        <torusGeometry args={[2.8, 0.32, 8, 48]} />
        <meshStandardMaterial color="#b8a779" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={rings}>
        <mesh rotation={[0, 0, 0.3]}>
          <torusGeometry args={[2.4, 0.035, 4, 64]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={open ? 3 : 0.2}
          />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI) / 4) * 2.8,
              Math.sin((i * Math.PI) / 4) * 2.8,
              0,
            ]}
          >
            <octahedronGeometry args={[0.23]} />
            <meshStandardMaterial
              color={c}
              emissive={c}
              emissiveIntensity={open ? 2 : 0.1}
            />
          </mesh>
        ))}
      </group>
      <mesh>
        <circleGeometry args={[2.35, 48]} />
        <meshStandardMaterial
          color={open ? c : "#18332d"}
          transparent
          opacity={open ? 0.32 : 0.82}
          emissive={c}
          emissiveIntensity={open ? 0.7 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {open && (
        <Sparkles count={60} scale={[5, 6, 2]} color={c} size={4} speed={0.5} />
      )}
    </group>
  );
}
function Water({ r }: { r: number }) {
  const m = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    m.current.position.y = -0.32 + Math.sin(clock.elapsedTime) * 0.035;
  });
  return (
    <mesh ref={m} position={[0, -0.3, -18]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[58, 88]} />
      <meshStandardMaterial
        color={r === 2 ? "#ec521c" : "#468f88"}
        emissive={r === 2 ? "#e94509" : "#1b655d"}
        emissiveIntensity={r === 2 ? 1.2 : 0.1}
        roughness={0.23}
        metalness={0.45}
      />
    </mesh>
  );
}
export function World({ menu = false }: { menu?: boolean }) {
  const d = useGame((s) => s.data);
  const r = menu ? 0 : d.realm;
  const theme = realms[r];
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.Fog(theme.fog, 25, 110);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, theme.sky, theme.fog]);
  const shifted = useGame((s) => s.shiftUntil) > Date.now();
  const open =
    d.shards.filter((s) => s.startsWith(`${r}:`)).length === 4 &&
    d.puzzles.includes(`${r}:altar`);
  return (
    <group>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#d8e7cd", theme.ground, 1.5]} />
      <directionalLight
        position={[-15, 28, 12]}
        intensity={3}
        color={r === 2 ? "#ffac6b" : "#fff2c7"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-65}
        shadow-bias={-0.001}
      />
      <Water r={r} />
      <RigidBody type="fixed" colliders="cuboid">
        <Block p={[0, -0.7, 8]} s={[43, 1, 24]} c={theme.ground} />
        <Block p={[0, -0.7, -32]} s={[43, 1, 48]} c={theme.ground} />
      </RigidBody>
      <Crossing realm={r} />
      {/* The four-metre river cut is crossed by each realm-specific bridge. */}
      {Array.from({ length: 37 }, (_, i) =>
        -53 + i * 1.9 > -8 && -53 + i * 1.9 < -4 ? null : (
          <group key={i}>
            {[-1, 0, 1].map((j) => (
              <Block
                key={j}
                p={[j * 1.9, 0.015, -53 + i * 1.9]}
                s={[1.8, 0.15, 1.8]}
                c={i % 3 === 0 ? "#7a8064" : r === 0 ? "#68725b" : theme.ground}
              />
            ))}
          </group>
        ),
      )}
      {[-1, 1].map((s) => (
        <group key={s}>
          {Array.from({ length: 25 }, (_, i) => {
            const x = s * (17 + rand(i + 6) * 7),
              z = 12 - i * 3.1;
            return (
              <group key={i}>
                {r === 0 || (r === 3 && i % 3 === 0) ? (
                  <Tree p={[x, 0, z]} seed={i + 2} />
                ) : r === 1 || (r === 3 && i % 3 === 1) ? (
                  <group>
                    <Block
                      p={[x, 7 + rand(i) * 12, z]}
                      s={[4, 14 + rand(i) * 24, 4]}
                      c="#1d3042"
                    />
                    {[0, 1, 2].map((j) => (
                      <Block
                        key={j}
                        p={[x - 2.03, 5 + j * 6, z]}
                        s={[0.06, 3, 1.8]}
                        c={j % 2 ? theme.accent : theme.color}
                      />
                    ))}
                  </group>
                ) : (
                  <mesh
                    position={[x, 2, z]}
                    rotation={[0.1, 0, s * 0.3]}
                    scale={[3, 6 + rand(i) * 8, 3]}
                    castShadow
                  >
                    <coneGeometry args={[1, 2, 5]} />
                    <meshStandardMaterial color="#3b303a" roughness={0.9} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      ))}
      {Array.from({ length: 60 }, (_, i) => {
        const x = (rand(i + 1) - 0.5) * 40,
          z = 14 - rand(i + 100) * 71;
        return Math.abs(x) < 4 ? null : (
          <group key={i} position={[x, 0.1, z]}>
            <mesh scale={[1 + rand(i), 0.5 + rand(i) * 0.6, 0.8]} castShadow>
              <dodecahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color={r === 0 ? "#67705a" : "#4e4655"} />
            </mesh>
            {r !== 2 && (
              <mesh position={[0.3, 0.5, 0.3]} rotation={[0.4, i, 0.5]}>
                <coneGeometry args={[0.55, 1.4, 5]} />
                <meshStandardMaterial
                  color={r === 0 ? "#4e794d" : theme.color}
                  emissive={r === 0 ? "#000" : theme.color}
                  emissiveIntensity={0.3}
                />
              </mesh>
            )}
          </group>
        );
      })}
      <group position={[0, 0, -43]}>
        <Pillar p={[-6, 0, 0]} height={9} />
        <Pillar p={[6, 0, 0]} height={9} />
        <Block p={[0, 9, 0]} s={[15, 1.2, 2.8]} />
        <Block p={[0, 10, 0]} s={[12, 1, 2.2]} />
        <Block p={[0, 10.8, 0]} s={[9, 0.7, 1.8]} />
        {[-1, 1].map((s) => (
          <Pillar key={s} p={[s * 11, 0, -5]} height={6} />
        ))}
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0, -2 - i * 14]}>
          <Pillar p={[-5.2, 0, 0]} height={i === 1 ? 4 : 6} />
          <Pillar p={[5.2, 0, 0]} height={6} />
          {i !== 1 && <Block p={[0, 6, 0]} s={[12, 0.6, 1.2]} />}
        </group>
      ))}
      {r === 0 && (
        <group position={[19, 0, -19]}>
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[2, 11, 2]} />
            <meshStandardMaterial
              color="#8bd0bd"
              transparent
              opacity={0.6}
              emissive="#4c9e8e"
              emissiveIntensity={0.4}
            />
          </mesh>
          <Sparkles count={70} scale={[5, 4, 5]} color="#c8fff0" size={3} />
        </group>
      )}
      {r < 3 &&
        shardPositions.map(
          (p, i) =>
            !d.shards.includes(`${r}:${i}`) && (
              <Float
                key={i}
                speed={2}
                rotationIntensity={0.4}
                floatIntensity={0.5}
              >
                <Crystal p={p} color={theme.color} />
                <Sparkles
                  position={p}
                  scale={2.5}
                  count={12}
                  color={theme.color}
                  size={3}
                />
              </Float>
            ),
        )}
      {seals.map((p, i) => (
        <group key={i} position={p}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
            <torusGeometry args={[1.4, 0.1, 6, 32]} />
            <meshStandardMaterial
              color={theme.color}
              emissive={theme.color}
              emissiveIntensity={d.puzzles.includes(`${r}:seal${i}`) ? 2 : 0.4}
              transparent
              opacity={r === 3 && !shifted ? 0.25 : 1}
            />
          </mesh>
          <Crystal
            p={[0, 1.1, 0]}
            color={
              d.puzzles.includes(`${r}:seal${i}`) ? "#f6d48c" : theme.color
            }
            scale={0.6}
          />
        </group>
      ))}
      <group position={[0, 0, -35]}>
        <Block p={[0, 0.35, 0]} s={[2, 0.7, 2]} />
        <Crystal
          p={[0, 1.6, 0]}
          color={d.puzzles.includes(`${r}:altar`) ? "#ffe3a1" : theme.color}
        />
      </group>
      {!d.chests.includes(`${r}:chest`) && (
        <group position={[-14, 0.5, -12]}>
          <Block p={[0, 0, 0]} s={[1.7, 1, 1.1]} c="#68523b" />
          <Block p={[0, 0.5, 0]} s={[1.8, 0.2, 1.2]} c="#d4b16b" />
          <Sparkles count={12} scale={[2, 2, 2]} color="#f7d98d" size={3} />
        </group>
      )}
      {r < 3 ? (
        <Portal r={r} open={menu || open} />
      ) : (
        <Float speed={1.2} floatIntensity={1}>
          <Crystal
            p={[0, 4, -48]}
            color={d.bossDefeated ? "#ffe6a3" : "#b3a2ff"}
            scale={2.5}
          />
          <Sparkles
            position={[0, 4, -48]}
            count={100}
            scale={10}
            color="#b3cfff"
            size={4}
          />
        </Float>
      )}
      <Sparkles
        count={r === 0 ? 100 : 160}
        scale={[44, 14, 76]}
        position={[0, 6, -18]}
        color={theme.color}
        opacity={0.45}
        speed={0.3}
        size={r === 2 ? 3 : 1.7}
      />
    </group>
  );
}
