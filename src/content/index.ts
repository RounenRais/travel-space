import bodiesJson from './bodies.json'
import asteroidsJson from './asteroids.json'
import type { AsteroidBody, Body, PlanetBody } from '../types'

const planets = Object.values(bodiesJson).map(
  (b) => ({ ...b, kind: 'planet' }) as unknown as PlanetBody,
)

const asteroids = Object.values(asteroidsJson).map(
  (a) => ({ ...a, kind: 'asteroid' }) as unknown as AsteroidBody,
)

export const PLANETS: PlanetBody[] = planets
export const ASTEROIDS: AsteroidBody[] = asteroids
export const ALL_BODIES: Body[] = [...planets, ...asteroids]

export const BODIES_BY_ID: Record<string, Body> = Object.fromEntries(
  ALL_BODIES.map((b) => [b.id, b]),
)
