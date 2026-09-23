import { useEffect } from 'react'
import { useTour } from '../../store'
import { isAsteroid, type Body } from '../../types'
import { RobotGuide } from './RobotGuide'
import { useTypewriter } from './useTypewriter'

export function DialogueCard({ body }: { body: Body }) {
  const lineIndex = useTour((s) => s.lineIndex)
  const advance = useTour((s) => s.advance)
  const exitFocus = useTour((s) => s.exitFocus)
  const reveal = useTour((s) => s.reveal)
  const revealed = useTour((s) => s.revealed)
  const openSimulation = useTour((s) => s.openSimulation)

  const line = body.dialogue[lineIndex]
  const isLast = lineIndex === body.dialogue.length - 1
  const { shown, done, skip } = useTypewriter(line.text)

  const next = () => (done ? advance() : skip())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'Escape') exitFocus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const showSimButton = isLast && done && isAsteroid(body)
  const showRevealButton =
    isLast && done && line.reveal !== undefined && !revealed.has(line.reveal)

  return (
    <div
      key={body.id}
      className="card-enter paper pointer-events-auto mx-auto w-full max-w-4xl"
      style={{ borderRadius: '2px 2px 3px 3px' }}
    >
      <div className="flex">
        {/* Delgi oluğu + portre: rehber sayfaya iliştirilmiş gibi. */}
        <div className="punch-gutter w-6 shrink-0 border-r" style={{ borderColor: 'var(--paper-fold)' }} />

        <div className="w-24 shrink-0 self-end pt-3 pl-2 sm:w-28">
          <RobotGuide speaking={!done} />
        </div>

        <div className="min-w-0 flex-1 px-4 pt-3 pb-3 sm:px-6">
          {/* Form başlığı: durak adı solda, günlük kaydı sağda. */}
          <div
            className="flex items-baseline justify-between gap-4 border-b pb-1.5"
            style={{ borderColor: 'var(--paper-line)' }}
          >
            <div className="flex items-baseline gap-3">
              <h2
                className="truncate text-lg font-semibold sm:text-xl"
                style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-graphite)' }}
              >
                {body.displayName}
              </h2>
              <span className="field-label truncate">{body.subtitle}</span>
            </div>
            <span className="numeric field-label shrink-0">
              {body.logCode} {lineIndex + 1}/{body.dialogue.length}
            </span>
          </div>

          <p
            className="min-h-[4.5rem] py-3 text-[0.97rem] leading-relaxed sm:min-h-[4rem] sm:text-base"
            style={{ fontFamily: 'var(--font-voice)', color: 'var(--color-graphite)' }}
          >
            {shown}
            {!done && <span className="caret" aria-hidden />}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {showRevealButton && (
                <button
                  onClick={() => reveal(line.reveal!)}
                  className="border px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    fontFamily: 'var(--font-tech)',
                    borderColor: 'var(--color-graphite)',
                    color: 'var(--color-graphite)',
                  }}
                >
                  Diğer yüzü çevir
                </button>
              )}
              {showSimButton && (
                <button
                  onClick={openSimulation}
                  className="border-2 px-3 py-1.5 text-sm font-semibold text-white transition-transform active:translate-y-px"
                  style={{
                    fontFamily: 'var(--font-tech)',
                    background: 'var(--color-redline)',
                    borderColor: 'var(--color-redline)',
                  }}
                >
                  Çarpma hesabını aç
                </button>
              )}
            </div>

            <button
              onClick={next}
              disabled={isLast && done}
              className="numeric flex items-center gap-2 text-sm font-medium disabled:opacity-35"
              style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-graphite)' }}
            >
              {done ? (isLast ? 'Kayıt tamam' : 'Devam') : 'Atla'}
              <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden>
                <path
                  d="M0 5h15M11 1l4 4-4 4"
                  fill="none"
                  stroke="var(--color-redline)"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
