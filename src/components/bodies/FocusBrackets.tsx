import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'

/** Ayracın ekranda inebileceği en küçük yarıçap (piksel). */
const MIN_SCREEN_RADIUS_PX = 26

const worldPos = new THREE.Vector3()

/**
 * Hover/odak göstergesi. Parlayan bir halka yerine matbaa "register mark"ı:
 * dört köşe ayracı. Işık değil mürekkep — tasarım yönünün 3B'deki karşılığı.
 */
export function FocusBrackets({
  radius,
  active,
  emphasized,
  label,
  showLabel,
}: {
  radius: number
  active: boolean
  emphasized: boolean
  label: string
  showLabel: boolean
}) {
  const mark = useRef<THREE.Group>(null)
  const lines = useRef<THREE.LineSegments>(null)
  const material = useRef<THREE.LineBasicMaterial>(null)
  const progress = useRef(0)

  // Geometri birim yarıçapta üretilir; gerçek boyut her karede ölçekle verilir,
  // çünkü ayracın ekrandaki alt sınırı kamera mesafesine bağlı.
  const geometry = useMemo(() => {
    const arm = 0.34
    const points: number[] = []
    // Dört köşe: her köşede iki kısa çizgi (L şeklinde ayraç).
    for (const [sx, sy] of [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ]) {
      points.push(sx, sy, 0, sx - sx * arm, sy, 0)
      points.push(sx, sy, 0, sx, sy - sy * arm, 0)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return g
  }, [])

  useFrame((state, delta) => {
    const target = active ? 1 : 0
    progress.current += (target - progress.current) * Math.min(1, delta * 9)

    if (material.current) material.current.opacity = progress.current * (emphasized ? 1 : 0.7)

    if (mark.current) {
      // Genel görünümde asteroitler birkaç pikselleik; ayraç onlara birebir
      // sarılsaydı görünmezdi. Alt sınırı dünya biriminde sabitlemek yerine
      // ekran uzayında tutuyoruz: uzakta ayraç okunur kalıyor, cisme
      // yaklaşınca da cismin gerçek boyutuna oturuyor (aksi hâlde yakın
      // planda kayanın beş katı bir çerçeve çiziliyordu).
      const camera = state.camera as THREE.PerspectiveCamera
      mark.current.getWorldPosition(worldPos)
      const distance = camera.position.distanceTo(worldPos)
      const viewportHeight = state.size.height
      const worldPerPixel =
        (2 * distance * Math.tan(((camera.fov ?? 50) * Math.PI) / 360)) / viewportHeight
      mark.current.scale.setScalar(Math.max(radius, MIN_SCREEN_RADIUS_PX * worldPerPixel))
    }

    if (lines.current) {
      // Ayraçlar açılırken hafifçe içeri kapanır — kilitlenme hissi.
      const s = 1.14 - progress.current * 0.14
      lines.current.scale.setScalar(s)
      if (emphasized) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.012
        lines.current.scale.multiplyScalar(pulse)
      }
    }
  })

  return (
    <Billboard>
      <group ref={mark}>
        <lineSegments ref={lines} geometry={geometry}>
          <lineBasicMaterial
            ref={material}
            color={emphasized ? '#C4372B' : '#EDE3CE'}
            transparent
            opacity={0}
            depthTest={false}
          />
        </lineSegments>
        {showLabel && (
          <Html
            position={[1.06, -1.06, 0]}
            style={{ pointerEvents: 'none', transform: 'translate(0, -50%)' }}
            zIndexRange={[20, 0]}
          >
            <span className="marker-code" data-emphasized={emphasized || undefined}>
              {label}
            </span>
          </Html>
        )}
      </group>
    </Billboard>
  )
}
