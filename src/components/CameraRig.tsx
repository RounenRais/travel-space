import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useTour } from '../store'
import { BODIES_BY_ID } from '../content'

const OVERVIEW_POSITION = new THREE.Vector3(4, 15, 42)
const OVERVIEW_TARGET = new THREE.Vector3(19, -1, -4)

/**
 * Kamerayı odaklanılan cisme yumuşakça taşır. Ekstra bir tween kütüphanesi
 * yok; her karede kritik sönümlü bir lerp yeterli ve daha öngörülebilir.
 *
 * `lerp` faktörünü delta'ya göre üstel biçimde hesaplıyoruz, yoksa animasyon
 * hızı kare hızına bağlı olur (144 Hz ekranda iki kat hızlı biter).
 */
export function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera)
  const mode = useTour((s) => s.mode)
  const focusedId = useTour((s) => s.focusedId)

  const desiredPosition = useRef(OVERVIEW_POSITION.clone())
  const desiredTarget = useRef(OVERVIEW_TARGET.clone())
  const settling = useRef(false)

  useEffect(() => {
    if (mode === 'focus' && focusedId) {
      const body = BODIES_BY_ID[focusedId]
      const center = new THREE.Vector3(...body.position)
      const distance = Math.max(body.visualScale * 4.4, 3.2)

      // Işık kaynağı orijindeki Güneş. Kamerayı körlemesine sabit bir yönden
      // yaklaştırırsak cismin gece yarısına bakmış oluyoruz; bu yüzden
      // yaklaşma yönünü her zaman Güneş'e göre kuruyoruz: biraz Güneş
      // tarafından, biraz yandan — üçte iki aydınlık bir görünüm.
      const awayFromSun = center.clone().normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3().crossVectors(up, awayFromSun).normalize()

      const offset = awayFromSun
        .clone()
        .multiplyScalar(-0.5 * distance)
        .addScaledVector(right, 0.8 * distance)
        .addScaledVector(up, 0.4 * distance)

      desiredPosition.current.copy(center).add(offset)
      // Cismi ekranın üst yarısında tut: alt yarıyı diyalog kartı kaplıyor.
      desiredTarget.current.copy(center).add(new THREE.Vector3(0, -body.visualScale * 0.3, 0))
    } else {
      desiredPosition.current.copy(OVERVIEW_POSITION)
      desiredTarget.current.copy(OVERVIEW_TARGET)
    }
    settling.current = true
  }, [mode, focusedId])

  useFrame((_, delta) => {
    if (!settling.current || !controls.current) return

    const k = 1 - Math.pow(0.0016, delta) // ~zaman-bağımsız yumuşatma
    camera.position.lerp(desiredPosition.current, k)
    controls.current.target.lerp(desiredTarget.current, k)
    controls.current.update()

    if (
      camera.position.distanceTo(desiredPosition.current) < 0.02 &&
      controls.current.target.distanceTo(desiredTarget.current) < 0.02
    ) {
      camera.position.copy(desiredPosition.current)
      controls.current.target.copy(desiredTarget.current)
      controls.current.update()
      settling.current = false
    }
  })

  return null
}
