import { useProgress } from '@react-three/drei'
import { ALL_BODIES, ASTEROIDS, PLANETS } from '../../content'
import { useTour } from '../../store'
import type { Body } from '../../types'

/** Üst metal şerit: turun durumu ve odaktan çıkış. */
export function TopStrip() {
  const mode = useTour((s) => s.mode)
  const visited = useTour((s) => s.visited)
  const exitFocus = useTour((s) => s.exitFocus)

  return (
    <header className="hull pointer-events-auto flex items-center justify-between border-b px-4 py-2 hull-rule">
      <div className="flex items-baseline gap-3">
        <span
          className="text-sm font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-paper)' }}
        >
          Rehber
        </span>
        <span className="field-label hidden sm:inline">Güneş sistemi turu · uçuş günlüğü</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="numeric field-label">
          <span style={{ color: 'var(--color-telemetry)' }}>{visited.size}</span>
          <span className="opacity-60"> / {ALL_BODIES.length} durak</span>
        </span>
        {mode === 'focus' && (
          <button
            onClick={exitFocus}
            className="border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/5"
            style={{
              fontFamily: 'var(--font-tech)',
              borderColor: 'var(--hull-line)',
              color: 'var(--color-paper)',
            }}
          >
            Genel görünüm
          </button>
        )}
      </div>
    </header>
  )
}

function RailGroup({ title, bodies }: { title: string; bodies: Body[] }) {
  const focusedId = useTour((s) => s.focusedId)
  const visited = useTour((s) => s.visited)
  const focus = useTour((s) => s.focus)
  const setHovered = useTour((s) => s.setHovered)

  return (
    <div className="mb-3">
      <div className="field-label border-b pb-1 hull-rule" style={{ borderColor: 'var(--hull-line)' }}>
        {title}
      </div>
      <ul>
        {bodies.map((body) => {
          const active = focusedId === body.id
          return (
            <li key={body.id}>
              <button
                onClick={() => focus(body.id)}
                onMouseEnter={() => setHovered(body.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex w-full items-baseline gap-2 border-b py-1.5 text-left transition-colors"
                style={{ borderColor: 'rgba(41,56,77,0.5)' }}
              >
                <span
                  className="numeric w-8 shrink-0 text-[0.65rem]"
                  style={{
                    fontFamily: 'var(--font-tech)',
                    color: active ? 'var(--color-redline)' : 'rgba(200,210,223,0.4)',
                  }}
                >
                  {body.logCode}
                </span>
                <span
                  className="truncate text-[0.82rem]"
                  style={{
                    fontFamily: 'var(--font-voice)',
                    color: active ? 'var(--color-paper)' : 'rgba(200,210,223,0.72)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {body.displayName}
                </span>
                {visited.has(body.id) && !active && (
                  <span aria-label="ziyaret edildi" style={{ color: 'var(--color-telemetry)' }}>
                    ✓
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Sol kenar: turun durak listesi. Kart değil, cetvelli bir form. */
export function StopRail() {
  return (
    <nav className="rail-in hull pointer-events-auto w-48 shrink-0 overflow-y-auto border-r px-3 py-3 hull-rule">
      <RailGroup title="Gezegenler ve uydu" bodies={PLANETS} />
      <RailGroup title="Asteroitler" bodies={ASTEROIDS} />
    </nav>
  )
}

/** Odaktaki cismin sayısal künyesi — soğuk veri, mavi mürekkep. */
export function TelemetryPanel({ body }: { body: Body }) {
  return (
    <aside
      className="rail-in hull pointer-events-auto hidden w-56 border px-3 py-2.5 lg:block"
      style={{ borderColor: 'var(--hull-line)' }}
    >
      <div className="field-label border-b pb-1" style={{ borderColor: 'var(--hull-line)' }}>
        Künye
      </div>
      <dl className="pt-1">
        {body.telemetry.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-2 border-b py-1.5"
            style={{ borderColor: 'rgba(41,56,77,0.5)' }}
          >
            <dt className="field-label">{row.label}</dt>
            <dd
              className="numeric text-[0.8rem] font-medium"
              style={{ color: 'var(--color-telemetry)' }}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}

/** Yükleme göstergesi: 8 MB'lık glb ve 12 MB'lık STL anında gelmiyor. */
export function LoadingCard() {
  const { active, progress, item } = useProgress()
  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-[#0b1018]/70">
      <div className="paper w-72 px-4 py-3" style={{ borderRadius: '2px' }}>
        <div className="field-label">Uçuş öncesi yükleme</div>
        <div
          className="numeric py-1 text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-graphite)' }}
        >
          %{Math.round(progress)}
        </div>
        <div className="h-1 w-full" style={{ background: 'var(--paper-line)' }}>
          <div
            className="h-full transition-[width] duration-200"
            style={{ width: `${progress}%`, background: 'var(--color-redline)' }}
          />
        </div>
        <div
          className="truncate pt-1.5 text-[0.7rem] opacity-55"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          {item ? item.split('/').pop() : 'hazırlanıyor'}
        </div>
      </div>
    </div>
  )
}

/** Genel görünümde ilk yönlendirme. */
export function OverviewHint() {
  const visited = useTour((s) => s.visited)
  if (visited.size > 0) return null

  return (
    <div className="pointer-events-none mx-auto max-w-md px-4 pb-2 text-center">
      <p
        className="text-sm"
        style={{ fontFamily: 'var(--font-voice)', color: 'rgba(200,210,223,0.62)' }}
      >
        Bir gök cismine tıkla, oraya gidelim. Sürükleyerek etrafına bakabilirsin.
      </p>
    </div>
  )
}
