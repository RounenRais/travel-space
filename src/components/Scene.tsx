import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ALL_BODIES } from '../content'
import { BodyMesh } from './bodies/BodyMesh'
import { Starfield, Sun } from './bodies/Environment'
import { CameraRig } from './CameraRig'
import { useTour } from '../store'

export function Scene() {
  const controls = useRef<OrbitControlsImpl>(null)
  const exitFocus = useTour((s) => s.exitFocus)
  const mode = useTour((s) => s.mode)

  return (
    <Canvas
      camera={{ position: [4, 15, 42], fov: 42, near: 0.05, far: 800 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true }}
      onPointerMissed={() => {
        if (mode === 'focus') exitFocus()
      }}
    >
      <color attach="background" args={['#0B1018']} />
      <fog attach="fog" args={['#0B1018', 120, 420]} />

      {/* Güneş ana ışık; çok hafif bir dolgu olmasa gölge tarafları
          tamamen siyah kalıyor ve modellerin silueti okunmuyor. */}
      <ambientLight intensity={0.22} color="#4a5a75" />
      <hemisphereLight args={['#2a3a55', '#0B1018', 0.35]} />

      <Starfield />
      <Sun />

      {/* Her cisim kendi Suspense sınırında: tek bir Suspense olsaydı, Ay'ın
          uzak yüzü yüklenirken tüm sahne bir an için kaybolurdu. */}
      {ALL_BODIES.map((body) => (
        <Suspense key={body.id} fallback={null}>
          <BodyMesh body={body} />
        </Suspense>
      ))}

      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={1.5}
        maxDistance={140}
      />
      <CameraRig controls={controls} />
    </Canvas>
  )
}
