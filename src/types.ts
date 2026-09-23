export type Vec3 = [number, number, number]

export interface DialogueLine {
  speaker: 'guide'
  text: string
  /** Bu replikte açılan opsiyonel içerik (ör. Ay'ın uzak yüzü). */
  reveal?: string
}

export interface TelemetryRow {
  label: string
  value: string
}

export type ModelSpec =
  | { type: 'glb'; path: string }
  | { type: 'stl'; path: string; color: string; roughness: number }
  | {
      /** Küre değil, kare kabartma plakası — yarım küreye geri sarılıyor. */
      type: 'stl-relief'
      path: string
      altPath?: string
      /** Kabartmanın hangi cisme dönük duracağı (Ay kilitli dönüşte). */
      facesToward?: string
      color: string
      roughness: number
    }
  | {
      type: 'sphere-texture'
      path: string
      ring?: { inner: number; outer: number; tilt: number }
    }

interface BodyBase {
  id: string
  displayName: string
  subtitle: string
  /** Uçuş günlüğündeki üç harfli durak kodu (TER, LUN, MAR...). */
  logCode: string
  model: ModelSpec
  visualScale: number
  position: Vec3
  spinSpeed: number
  telemetry: TelemetryRow[]
  dialogue: DialogueLine[]
}

export interface PlanetBody extends BodyBase {
  kind: 'planet'
  simulation: null
}

export interface AsteroidBody extends BodyBase {
  kind: 'asteroid'
  defaultDiameterM: number
  defaultVelocityKms: number
  defaultDensityKgM3: number
  dataNote: string
  simulation: true
}

export type Body = PlanetBody | AsteroidBody

export function isAsteroid(body: Body): body is AsteroidBody {
  return body.kind === 'asteroid'
}
