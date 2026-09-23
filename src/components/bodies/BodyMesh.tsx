import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  makeRingGeometry,
  makeRingTexture,
  normalizeObject3D,
  useNormalizedStl,
  useReliefStl,
} from '../../systems/geometry'
import type { Body } from '../../types'
import { useTour } from '../../store'
import { BODIES_BY_ID } from '../../content'
import { FocusBrackets } from './FocusBrackets'

function GlbModel({ path }: { path: string }) {
  const { scene } = useGLTF(path)
  const normalized = useMemo(() => normalizeObject3D(scene), [scene])
  return <primitive object={normalized} />
}

function StlModel({
  path,
  color,
  roughness,
}: {
  path: string
  color: string
  roughness: number
}) {
  const geometry = useNormalizedStl(path)
  return (
    <mesh geometry={geometry}>
      {/* STL renk/UV taşımaz — düz taşımsı materyal MVP için yeterli. */}
      <meshStandardMaterial color={color} roughness={roughness} metalness={0} flatShading={false} />
    </mesh>
  )
}

/**
 * Ay. Kaynak dosya yarım küreye sarılmış bir kabartma plakası olduğu için
 * arkası açık kalıyor; içine biraz küçük, düz bir küre koyup silueti
 * tamamlıyoruz. Böylece hangi açıdan bakılırsa bakılsın Ay bir küre gibi
 * duruyor, kabartma da doğru yüzde kalıyor.
 */
function ReliefModel({
  path,
  color,
  roughness,
  faceDirection,
}: {
  path: string
  color: string
  roughness: number
  faceDirection: THREE.Vector3 | null
}) {
  const geometry = useReliefStl(path)

  const quaternion = useMemo(() => {
    const dummy = new THREE.Object3D()
    if (faceDirection) dummy.lookAt(faceDirection)
    return dummy.quaternion.clone()
  }, [faceDirection])

  return (
    <group quaternion={quaternion}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.975, 64, 48]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
      </mesh>
    </group>
  )
}

function TexturedSphere({ path }: { path: string }) {
  const loaded = useLoader(THREE.TextureLoader, path)

  // useLoader önbelleği paylaşımlı; dönen dokuyu yerinde değiştirmek yerine
  // kendi kopyamızı kuruyoruz. Görüntü verisi kopyalanmaz, yalnızca
  // parametreler ayrışır.
  const texture = useMemo(() => {
    const t = loaded.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [loaded])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
    </mesh>
  )
}

function Ring({ inner, outer, tilt }: { inner: number; outer: number; tilt: number }) {
  const geometry = useMemo(() => makeRingGeometry(inner, outer), [inner, outer])
  const texture = useMemo(() => makeRingTexture(), [])
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2 + tilt * 0.12, 0, 0]}>
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        opacity={0.92}
      />
    </mesh>
  )
}

export function BodyMesh({ body }: { body: Body }) {
  const group = useRef<THREE.Group>(null)
  const spinner = useRef<THREE.Group>(null)

  const focusedId = useTour((s) => s.focusedId)
  const hoveredId = useTour((s) => s.hoveredId)
  const revealed = useTour((s) => s.revealed)
  const focus = useTour((s) => s.focus)
  const setHovered = useTour((s) => s.setHovered)

  const isFocused = focusedId === body.id
  const isHovered = hoveredId === body.id
  const { model, visualScale } = body

  // Ay'ın uzak yüzü ancak rehber teklif ettikten sonra yüklenir —
  // 12 MB'lık ikinci bir STL'i peşinen indirmenin anlamı yok.
  const reliefPath =
    model.type === 'stl-relief' && model.altPath && revealed.has('far-side')
      ? model.altPath
      : model.type === 'stl-relief'
        ? model.path
        : ''

  // Ay kilitli dönüşte: kabartmalı yüz her zaman Dünya'ya bakar.
  const faceDirection = useMemo(() => {
    if (model.type !== 'stl-relief' || !model.facesToward) return null
    const target = BODIES_BY_ID[model.facesToward]
    if (!target) return null
    return new THREE.Vector3(...target.position).sub(new THREE.Vector3(...body.position))
  }, [model, body.position])

  useFrame((_, delta) => {
    if (spinner.current) spinner.current.rotation.y += body.spinSpeed * delta
  })

  const tilt: [number, number, number] =
    body.kind === 'asteroid' ? [0.4, 0, 0.7] : [0, 0, 0.12]

  return (
    <group ref={group} position={body.position}>
      <group ref={spinner} scale={visualScale} rotation={tilt}>
        {model.type === 'glb' && <GlbModel path={model.path} />}
        {model.type === 'stl' && (
          <StlModel path={model.path} color={model.color} roughness={model.roughness} />
        )}
        {model.type === 'stl-relief' && (
          <ReliefModel
            key={reliefPath}
            path={reliefPath}
            color={model.color}
            roughness={model.roughness}
            faceDirection={faceDirection}
          />
        )}
        {model.type === 'sphere-texture' && <TexturedSphere path={model.path} />}
      </group>

      {model.type === 'sphere-texture' && model.ring && (
        <group scale={visualScale} rotation={[0, 0, 0.22]}>
          <Ring inner={model.ring.inner} outer={model.ring.outer} tilt={model.ring.tilt} />
        </group>
      )}

      {/* Düzensiz şekilli cisimlere nişan almak zor; görünmez bir küre
          tıklama/hover hedefini büyütüyor. */}
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation()
          focus(body.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(body.id)
        }}
        onPointerOut={() => setHovered(null)}
      >
        <sphereGeometry args={[Math.max(visualScale * 1.35, 0.9), 16, 16]} />
      </mesh>

      <FocusBrackets
        /* Alt sınır yok: ayraç kendi içinde ekran uzayında bir taban
           uyguluyor, burada cismin gerçek yarıçapını vermek yeterli. */
        radius={visualScale * 1.22}
        active={isHovered || isFocused}
        emphasized={isFocused}
        label={body.logCode}
        /* Odaktayken adı zaten diyalog kartı yazıyor; etiket orada sadece
           kartın üstüne taşıyordu. Yalnızca hover'da göster. */
        showLabel={isHovered && !isFocused}
      />
    </group>
  )
}

useGLTF.preload('/models/earth/earth.glb')
