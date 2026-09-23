import { useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

/**
 * STL ham üçgen geometrisidir: renk, UV, materyal taşımaz ve genelde
 * merkezlenmemiş, rastgele ölçekte gelir. Bu yüzden her STL'i yükledikten
 * sonra (1) normalleri yeniden hesaplıyor, (2) sınırlayıcı kutunun merkezini
 * orijine çekiyor, (3) sınırlayıcı küre yarıçapını 1 birime normalize ediyoruz.
 * Böylece sahnedeki ölçek tamamen `visualScale` ile kontrol edilebiliyor.
 */
export function normalizeGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = source.clone()

  geometry.computeVertexNormals()

  geometry.computeBoundingBox()
  const center = new THREE.Vector3()
  geometry.boundingBox!.getCenter(center)
  geometry.translate(-center.x, -center.y, -center.z)

  geometry.computeBoundingSphere()
  const radius = geometry.boundingSphere?.radius ?? 1
  if (radius > 0) geometry.scale(1 / radius, 1 / radius, 1 / radius)

  geometry.computeBoundingSphere()
  return geometry
}

/** STL'i yükler ve merkezlenmiş/normalize edilmiş halini döndürür. */
export function useNormalizedStl(url: string): THREE.BufferGeometry {
  const raw = useLoader(STLLoader, url)
  return useMemo(() => normalizeGeometry(raw), [raw])
}

/** Kabartma plakasını yükler ve yarım küreye sarılmış halini döndürür. */
export function useReliefStl(url: string): THREE.BufferGeometry {
  const raw = useLoader(STLLoader, url)
  return useMemo(() => sphereizeRelief(raw), [raw])
}

/**
 * Satürn halkası için prosedürel doku. Halka texture'ı elimizde olmadığından
 * canvas üzerinde radyal bir bant deseni üretiyoruz: Cassini boşluğunu andıran
 * bir kesinti ve içe/dışa doğru sönümlenen opaklık.
 */
export function makeRingTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = 1
  const ctx = canvas.getContext('2d')!

  // Halka parçacıkları buz ve kaya; rengi gezegenin soluk bir yankısı olsun.
  const bands: Array<[number, string]> = [
    [0.0, 'rgba(196,178,148,0)'],
    [0.06, 'rgba(196,178,148,0.55)'],
    [0.28, 'rgba(214,198,168,0.78)'],
    [0.42, 'rgba(180,164,138,0.42)'],
    [0.48, 'rgba(120,110,96,0.12)'], // Cassini boşluğu
    [0.54, 'rgba(206,190,160,0.72)'],
    [0.78, 'rgba(188,172,144,0.6)'],
    [0.93, 'rgba(160,148,126,0.22)'],
    [1.0, 'rgba(160,148,126,0)'],
  ]

  const gradient = ctx.createLinearGradient(0, 0, size, 0)
  for (const [stop, color] of bands) gradient.addColorStop(stop, color)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, 1)

  // İnce rastgele çizgilenme — düz gradient fazla temiz duruyor.
  for (let x = 0; x < size; x++) {
    const jitter = (Math.sin(x * 0.7) + Math.sin(x * 0.13)) * 0.5
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0, jitter) * 0.08})`
    ctx.fillRect(x, 0, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/**
 * Three.js'in RingGeometry'si UV'leri (0..1, 0..1) kutusal olarak üretir;
 * radyal bir doku bu UV'lerle merkezden dışarı doğru gerilir ve halka
 * yanlış görünür. Her vertex'in merkeze olan mesafesini iç/dış yarıçap
 * arasında 0..1'e map ederek u koordinatını yeniden yazıyoruz.
 */
export function makeRingGeometry(inner: number, outer: number): THREE.RingGeometry {
  const geometry = new THREE.RingGeometry(inner, outer, 180, 1)
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  const v = new THREE.Vector3()

  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i)
    const distance = v.length()
    const u = (distance - inner) / (outer - inner)
    uv.setXY(i, u, 0.5)
  }
  uv.needsUpdate = true

  return geometry
}

/**
 * glb dosyaları kendi materyalini taşır ama ölçeği/merkezi keyfîdir.
 * Sahnedeki tüm cisimleri aynı dilde konuşturmak için glb sahnesini de
 * 1 birim yarıçapa normalize edip merkezliyoruz.
 */
export function normalizeObject3D(source: THREE.Object3D): THREE.Group {
  const root = new THREE.Group()
  const model = source.clone(true)

  const box = new THREE.Box3().setFromObject(model)
  const center = new THREE.Vector3()
  const sphere = new THREE.Sphere()
  box.getCenter(center)
  box.getBoundingSphere(sphere)

  model.position.sub(center)
  const scale = sphere.radius > 0 ? 1 / sphere.radius : 1

  const wrapper = new THREE.Group()
  wrapper.add(model)
  wrapper.scale.setScalar(scale)
  root.add(wrapper)

  return root
}

/**
 * Ay dosyaları küre değil: 78 × 78 × 3,6 birimlik KARE bir kabartma
 * plakası (3B baskı için üretilmiş rölyef). Düz haliyle sahneye koyunca
 * uzayda duran bir levha gibi görünüyor.
 *
 * Burada plakayı yarım küreye geri sarıyoruz: karenin içine çizilen daireyi
 * ortografik izdüşümün tersi ile açıyoruz (merkezden uzaklık r, küre üstünde
 * sin θ'ya karşılık gelir), yükseklik değerini de yarıçap sapmasına
 * çeviriyoruz. Dairenin dışında kalan köşeler (yaklaşık %22) atılıyor —
 * onlar ufuk çizgisinin ötesi.
 *
 * VARSAYIM: Kaynak plakanın ortografik izdüşüm olduğunu kabul ediyoruz.
 * Dosyalarla birlikte bir projeksiyon belgesi gelmedi. Bkz. README.
 */
export function sphereizeRelief(
  source: THREE.BufferGeometry,
  reliefScale = 0.04,
): THREE.BufferGeometry {
  const src = source.index ? source.toNonIndexed() : source
  const pos = src.attributes.position.array

  src.computeBoundingBox()
  const box = src.boundingBox!
  const cx = (box.min.x + box.max.x) / 2
  const cy = (box.min.y + box.max.y) / 2
  const zMin = box.min.z
  const zSpan = Math.max(box.max.z - zMin, 1e-6)
  const R = Math.max(box.max.x - cx, box.max.y - cy)

  const triangles = pos.length / 9
  const out: number[] = []
  const vx = new Array(3)
  const vy = new Array(3)
  const vz = new Array(3)

  for (let t = 0; t < triangles; t++) {
    let inside = true
    for (let k = 0; k < 3; k++) {
      const i = t * 9 + k * 3
      const dx = pos[i] - cx
      const dy = pos[i + 1] - cy
      if (Math.hypot(dx, dy) > R * 0.999) {
        inside = false
        break
      }
      vx[k] = dx
      vy[k] = dy
      vz[k] = pos[i + 2]
    }
    if (!inside) continue

    for (let k = 0; k < 3; k++) {
      const u = Math.min(Math.hypot(vx[k], vy[k]) / R, 1)
      const theta = Math.asin(u)
      const phi = Math.atan2(vy[k], vx[k])
      const h = (vz[k] - zMin) / zSpan
      // Gerçek Ay kabartması yarıçapın binde beşi kadar; görünür olsun diye
      // kasıtlı olarak abartıyoruz.
      const radius = 1 + reliefScale * (h - 0.5)
      const sinT = Math.sin(theta)
      out.push(
        radius * sinT * Math.cos(phi),
        radius * sinT * Math.sin(phi),
        radius * Math.cos(theta),
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
