/**
 * Asteroit çarpma hesapları.
 *
 * Enerji kısmı kesin fizik. Krater kısmı Collins, Melosh & Marcus (2005),
 * "Earth Impact Effects Program" makalesindeki ölçekleme denklemine dayanan
 * bir YAKLAŞIMDIR — bilimsel kesinlik iddia etmez.
 *
 * Birim sözleşmesi: bu dosyanın içinde her şey SI (metre, saniye, kg, joule).
 * Çevirimler yalnızca sınırda (girdi/çıktı) yapılır.
 */

const JOULES_PER_MEGATON = 4.184e15
const TARGET_DENSITY = 2500 // kg/m³ — Dünya kabuğu (tortul/kristalin karışımı)
const GRAVITY = 9.81 // m/s²
/** Geçici kraterden final kratere: basit krater varsayımı. */
const SIMPLE_CRATER_FACTOR = 1.25

export interface ImpactInput {
  /** Çarpanın çapı, metre */
  diameterM: number
  /** Çarpma hızı, km/s */
  velocityKms: number
  /** Çarpanın yoğunluğu, kg/m³ */
  densityKgM3: number
  /** Çarpma açısı, yataydan derece (90° = dik) */
  angleDeg: number
}

export interface ImpactResult {
  massKg: number
  energyJoules: number
  energyMegatons: number
  /** Geçici krater çapı, km */
  transientCraterKm: number
  /** Final krater çapı, km */
  finalCraterKm: number
}

export function computeImpact({
  diameterM,
  velocityKms,
  densityKgM3,
  angleDeg,
}: ImpactInput): ImpactResult {
  const radiusM = diameterM / 2
  const volumeM3 = (4 / 3) * Math.PI * radiusM ** 3
  const massKg = volumeM3 * densityKgM3

  const velocityMs = velocityKms * 1000
  const energyJoules = 0.5 * massKg * velocityMs ** 2

  const angleRad = (angleDeg * Math.PI) / 180

  // D_tc = 1.161 * (ρi/ρt)^(1/3) * L^0.78 * v^0.44 * g^-0.22 * sin(θ)^(1/3)
  // L metre, v m/s, g m/s² verildiğinde sonuç metre cinsinden çıkar.
  const transientCraterM =
    1.161 *
    (densityKgM3 / TARGET_DENSITY) ** (1 / 3) *
    diameterM ** 0.78 *
    velocityMs ** 0.44 *
    GRAVITY ** -0.22 *
    Math.sin(angleRad) ** (1 / 3)

  return {
    massKg,
    energyJoules,
    energyMegatons: energyJoules / JOULES_PER_MEGATON,
    transientCraterKm: transientCraterM / 1000,
    finalCraterKm: (transientCraterM * SIMPLE_CRATER_FACTOR) / 1000,
  }
}

/**
 * Büyük sayıları okunur hâle getirir: 12 340 000 → "12,3 milyon".
 * Binler mertebesinde "1,41 bin" demek yerine basamak ayırıcı kullanıyoruz —
 * "1.410" hem daha kısa hem de Türkçede daha doğal.
 */
export function formatScaled(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${trim(value / 1e9)} milyar`
  if (abs >= 1e6) return `${trim(value / 1e6)} milyon`
  if (abs >= 1e3) return Math.round(value).toLocaleString('tr-TR')
  return trim(value)
}

export function trim(value: number): string {
  const abs = Math.abs(value)
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2
  return value.toFixed(digits).replace('.', ',')
}
