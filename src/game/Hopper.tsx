import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
export function Hopper({
  moving = false,
  attack = 0,
  character = 0,
  outfit = 0,
  weapon = 0,
}: {
  moving?: boolean;
  attack?: number;
  character?: number;
  outfit?: number;
  weapon?: number;
}) {
  const group = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  const arm = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    left.current.rotation.x = moving ? Math.sin(t * 11) * 0.65 : 0;
    right.current.rotation.x = -left.current.rotation.x;
    arm.current.rotation.x =
      Date.now() - attack < 320
        ? -1.6 + Math.sin(((Date.now() - attack) / 320) * Math.PI) * 2.4
        : Math.sin(t * 2) * 0.035;
    group.current.position.y = moving
      ? Math.abs(Math.sin(t * 11)) * 0.05
      : Math.sin(t * 2) * 0.025;
  });
  const cloth = ["#327d77", "#723d72", "#9e5936"][outfit] || "#327d77";
  return (
    <group ref={group}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <capsuleGeometry args={[character ? 0.27 : 0.31, 0.48, 4, 8]} />
        <meshStandardMaterial color={cloth} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.84, 0]} castShadow>
        <sphereGeometry args={[0.235, 12, 10]} />
        <meshStandardMaterial color="#c99472" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.99, 0.035]} castShadow>
        <sphereGeometry
          args={[0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]}
        />
        <meshStandardMaterial color="#2a272b" />
      </mesh>
      {character === 1 && (
        <mesh position={[0, 1.83, 0.2]} castShadow>
          <capsuleGeometry args={[0.11, 0.35, 4, 8]} />
          <meshStandardMaterial color="#2a272b" />
        </mesh>
      )}
      <mesh position={[0, 1.24, 0.22]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.45, 0.65, 0.19]} />
        <meshStandardMaterial color="#283f3c" />
      </mesh>
      <mesh position={[0, 1.04, -0.03]}>
        <boxGeometry args={[0.63, 0.11, 0.42]} />
        <meshStandardMaterial
          color="#bb9657"
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group
          key={s}
          ref={i === 0 ? left : right}
          position={[s * 0.18, 0.91, 0]}
        >
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.115, 0.38, 4, 8]} />
            <meshStandardMaterial color="#283738" />
          </mesh>
          <mesh position={[0, -0.67, -0.07]} castShadow>
            <boxGeometry args={[0.24, 0.23, 0.38]} />
            <meshStandardMaterial color="#443b32" />
          </mesh>
        </group>
      ))}
      <group ref={arm} position={[0.4, 1.5, 0]}>
        <mesh position={[0, -0.23, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
          <meshStandardMaterial color={cloth} />
        </mesh>
        <mesh
          visible={weapon !== 1 && weapon !== 2}
          position={[0, -0.45, -0.15]}
          rotation={[-0.5, 0, 0]}
        >
          <boxGeometry args={[0.09, 0.85, 0.065]} />
          <meshStandardMaterial
            color="#baf9ea"
            emissive="#66eab4"
            emissiveIntensity={1.1}
            metalness={0.65}
            roughness={0.2}
          />
        </mesh>
        {weapon === 1 && (
          <group position={[0, -0.4, -0.4]}>
            <mesh>
              <boxGeometry args={[0.2, 0.24, 0.7]} />
              <meshStandardMaterial
                color="#45556e"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0, -0.38]}>
              <cylinderGeometry args={[0.09, 0.09, 0.1, 8]} />
              <meshStandardMaterial
                color="#89f5ff"
                emissive="#44cfff"
                emissiveIntensity={2}
              />
            </mesh>
          </group>
        )}
        {weapon === 2 && (
          <group position={[0, -0.1, -0.25]}>
            <mesh>
              <boxGeometry args={[0.75, 0.38, 0.4]} />
              <meshStandardMaterial color="#5c4241" metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, -0.21]}>
              <boxGeometry args={[0.6, 0.13, 0.02]} />
              <meshStandardMaterial
                color="#ffc46b"
                emissive="#ff6d1a"
                emissiveIntensity={2}
              />
            </mesh>
          </group>
        )}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.32, 0.07, 0.12]} />
          <meshStandardMaterial
            color="#d4ba7d"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
      <mesh position={[-0.43, 1.28, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
        <meshStandardMaterial color={cloth} />
      </mesh>
      <mesh position={[0, 1.65, -0.17]}>
        <torusGeometry args={[0.16, 0.055, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#c9b17b" />
      </mesh>
    </group>
  );
}
