import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useGame } from "./store";
export function Crossing({ realm }: { realm: number }) {
  const body = useRef<RapierRigidBody>(null!);
  useFrame(({ clock }) => {
    if (!body.current) return;
    if (realm === 1)
      body.current.setNextKinematicTranslation({
        x: Math.sin(clock.elapsedTime * 0.65) * 2,
        y: -0.25,
        z: -6,
      });
    if (realm === 3)
      body.current.setEnabled(Date.now() < useGame.getState().shiftUntil);
  });
  const c =
    realm === 0
      ? "#847554"
      : realm === 1
        ? "#39748b"
        : realm === 2
          ? "#6b5350"
          : "#9a8fc3";
  return (
    <group>
      <RigidBody
        ref={body}
        type={realm === 1 ? "kinematicPosition" : "fixed"}
        position={[0, -0.25, -6]}
        colliders="cuboid"
      >
        <mesh receiveShadow>
          <boxGeometry args={[5, 0.3, 5]} />
          <meshStandardMaterial
            color={c}
            metalness={realm === 1 ? 0.7 : 0.1}
            roughness={0.6}
          />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[0, 0.2, -2.25 + i * 0.5]} castShadow>
            <boxGeometry args={[5, 0.12, 0.4]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
      </RigidBody>
      {realm === 0 &&
        [-1, 1].map((s) => (
          <group key={s}>
            {[-3, -1.5, 0, 1.5, 3].map((z, i) => (
              <group key={z}>
                <mesh position={[s * 2.65, 0.7, z - 6]}>
                  <cylinderGeometry args={[0.05, 0.05, 1.6, 5]} />
                  <meshStandardMaterial color="#aa9c72" />
                </mesh>
                {i < 4 && (
                  <mesh
                    position={[s * 2.65, 1.4, z - 5.25]}
                    rotation={[Math.PI / 2, 0, 0]}
                  >
                    <cylinderGeometry args={[0.06, 0.06, 1.6, 5]} />
                    <meshStandardMaterial color="#c6b688" />
                  </mesh>
                )}
              </group>
            ))}
          </group>
        ))}
      {realm === 3 && (
        <mesh position={[0, 0.1, -6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial
            color="#b1a0ff"
            emissive="#9b7dff"
            emissiveIntensity={1}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}
