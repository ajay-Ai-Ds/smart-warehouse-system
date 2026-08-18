'use client';

/**
 * Warehouse3DCanvas — 3D Pallet Storage Visualization using React Three Fiber.
 *
 * Renders an interactive 3D pallet stack with animated lighting and controls.
 * Lazy loaded on the landing page to keep initial page weight light.
 *
 * @module Warehouse3DCanvas
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function WarehouseBoxStack() {
  const boxes = [
    // Base Layer
    { position: [-1.2, 0, -1.2], args: [1.8, 1.2, 1.8], color: '#d97706' },
    { position: [1.2, 0, -1.2], args: [1.8, 1.2, 1.8], color: '#475569' },
    { position: [-1.2, 0, 1.2], args: [1.8, 1.2, 1.8], color: '#2563eb' },
    { position: [1.2, 0, 1.2], args: [1.8, 1.2, 1.8], color: '#d97706' },

    // Second Layer
    { position: [-0.6, 1.3, -0.6], args: [1.6, 1.1, 1.6], color: '#059669' },
    { position: [0.6, 1.3, -0.6], args: [1.6, 1.1, 1.6], color: '#d97706' },
    { position: [0, 1.3, 0.6], args: [1.6, 1.1, 1.6], color: '#dc2626' },

    // Top Layer
    { position: [0, 2.5, 0], args: [1.4, 1.0, 1.4], color: '#7c3aed' },
  ];

  return (
    <group position={[0, -0.8, 0]}>
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[4.8, 0.2, 4.8]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>

      {boxes.map((box, idx) => (
        <mesh key={idx} position={box.position}>
          <boxGeometry args={box.args} />
          <meshStandardMaterial
            color={box.color}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Warehouse3DCanvas() {
  return (
    <Canvas
      camera={{ position: [5, 4, 6], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <WarehouseBoxStack />

      <OrbitControls
        autoRotate
        autoRotateSpeed={1.8}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </Canvas>
  );
}
