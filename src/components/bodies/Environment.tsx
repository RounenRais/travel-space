import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Yıldız alanı. Hazır bir "sparkles" efekti yerine sabit bir nokta bulutu:
 * kıpırdamayan, soğuk beyaz, çok küçük noktalar. Arka plan sakin kalmalı.
 */
/**
 * Tohumlu PRNG (mulberry32). `Math.random` yerine bunu kullanıyoruz ki yıldız
 * alanı her yüklemede birebir aynı çıksın: ekran görüntüsü alırken, sunumu
 * tekrarlarken sahnenin aynı kalması önemli.
 */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Starfield({ count = 2400 }: { count?: number }) {
  const geometry = useMemo(() => {
    const random = seededRandom(0x5eed_1a7e)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Küresel kabuk üzerinde düzgün dağılım.
      const u = random() * 2 - 1
      const theta = random() * Math.PI * 2
      const r = 240 + random() * 90
      const s = Math.sqrt(1 - u * u)
      positions[i * 3] = r * s * Math.cos(theta)
      positions[i * 3 + 1] = r * u
      positions[i * 3 + 2] = r * s * Math.sin(theta)
      sizes[i] = random() < 0.06 ? 1.9 : 0.85
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return g
  }, [count])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#cfd8e3"
        size={1.1}
        sizeAttenuation={false}
        transparent
        opacity={0.75}
        depthWrite={false}
        fog={false}
      />
    </points>
  )
}

/** Güneş: sahnenin ışık kaynağı ve tek sıcak nesnesi. */
export function Sun() {
  const glow = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glow.current) {
      const t = state.clock.elapsedTime
      glow.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.012)
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* decay=2 (gerçek kare-ters yasa) ile Satürn neredeyse tamamen karanlık
          kalıyordu; sahne okunabilir olsun diye sönüm kasıtlı olarak yumuşatıldı. */}
      <pointLight intensity={1100} distance={0} decay={1.5} color="#fff2dc" />
      <mesh>
        <sphereGeometry args={[3, 48, 48]} />
        <meshBasicMaterial color="#ffd9a0" />
      </mesh>
      <mesh ref={glow} scale={1.0}>
        <sphereGeometry args={[3.6, 32, 32]} />
        <meshBasicMaterial color="#e8a75c" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}
