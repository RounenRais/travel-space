import { useEffect, useMemo, useState } from 'react'
import { ASTEROIDS } from '../../content'
import { computeImpact, formatScaled, trim } from '../../systems/impact'
import { useTour } from '../../store'
import type { AsteroidBody } from '../../types'

/** Çap kaydırıcısı logaritmik: 50 m ile 10 km arası üç büyüklük mertebesi. */
const MIN_D = 50
const MAX_D = 10000
const LOG_MIN = Math.log10(MIN_D)
const LOG_SPAN = Math.log10(MAX_D) - LOG_MIN

const diameterToSlider = (d: number) => ((Math.log10(d) - LOG_MIN) / LOG_SPAN) * 1000
const sliderToDiameter = (s: number) => 10 ** (LOG_MIN + (s / 1000) * LOG_SPAN)

function Dial({
  label,
  display,
  unit,
  sliderValue,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  display: string
  unit: string
  sliderValue: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block pb-1">
      <div className="flex items-baseline justify-between">
        <span className="field-label">{label}</span>
        <span
          className="numeric text-sm font-semibold"
          style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-graphite)' }}
        >
          {display}
          <span className="pl-1 text-[0.7rem] font-normal opacity-60">{unit}</span>
        </span>
      </div>
      <input
        className="dial"
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function Result({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="computed inline-block">
        <span
          className="numeric text-2xl font-bold sm:text-[1.75rem]"
          style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-graphite)' }}
        >
          {value}
        </span>
        <span className="pl-1.5 text-xs opacity-70" style={{ fontFamily: 'var(--font-tech)' }}>
          {unit}
        </span>
      </div>
    </div>
  )
}

export function ImpactWorksheet({ body }: { body: AsteroidBody }) {
  const closeSimulation = useTour((s) => s.closeSimulation)

  // Esc, çalışma sayfası açıkken diyaloğa döner. Klavye kısayolu diyalog
  // kartında yaşıyor ama bu panel açıldığında o kart sökülüyor; burada
  // karşılığını vermezsek Esc panel açıkken hiçbir şey yapmıyor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeSimulation()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeSimulation])

  const [selectedId, setSelectedId] = useState(body.id)
  const selected = ASTEROIDS.find((a) => a.id === selectedId) ?? body

  const clampDiameter = (d: number) => Math.min(MAX_D, Math.max(MIN_D, d))

  const [diameter, setDiameter] = useState(() => clampDiameter(body.defaultDiameterM))
  const [velocity, setVelocity] = useState(body.defaultVelocityKms)
  const [angle, setAngle] = useState(45)

  const pick = (id: string) => {
    const next = ASTEROIDS.find((a) => a.id === id)
    if (!next) return
    setSelectedId(id)
    setDiameter(clampDiameter(next.defaultDiameterM))
    setVelocity(next.defaultVelocityKms)
  }

  const result = useMemo(
    () =>
      computeImpact({
        diameterM: diameter,
        velocityKms: velocity,
        densityKgM3: selected.defaultDensityKgM3,
        angleDeg: angle,
      }),
    [diameter, velocity, angle, selected.defaultDensityKgM3],
  )

  // Kleopatra 124 km — kaydırıcının üst sınırının çok üstünde. Sessizce
  // kırpmak yerine kullanıcıya söylüyoruz.
  const isClamped = selected.defaultDiameterM > MAX_D

  return (
    <div
      className="card-enter paper pointer-events-auto mx-auto w-full max-w-4xl"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex">
        <div
          className="punch-gutter w-6 shrink-0 border-r"
          style={{ borderColor: 'var(--paper-fold)' }}
        />

        <div className="min-w-0 flex-1 px-4 py-3 sm:px-6">
          <div
            className="flex items-baseline justify-between gap-3 border-b pb-1.5"
            style={{ borderColor: 'var(--paper-line)' }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-tech)', color: 'var(--color-graphite)' }}
            >
              Çarpma çalışma sayfası
            </h2>
            <button
              onClick={closeSimulation}
              className="field-label transition-opacity hover:opacity-70"
            >
              Kapat
            </button>
          </div>

          {/* Çarpan seçimi: sekme değil, formun üstündeki kutucuk sırası. */}
          <div className="flex flex-wrap gap-1.5 py-2.5">
            {ASTEROIDS.map((a) => {
              const on = a.id === selectedId
              return (
                <button
                  key={a.id}
                  onClick={() => pick(a.id)}
                  className="border px-2 py-1 text-xs transition-colors"
                  style={{
                    fontFamily: 'var(--font-tech)',
                    borderColor: on ? 'var(--color-redline)' : 'var(--paper-line)',
                    background: on ? 'var(--color-redline)' : 'transparent',
                    color: on ? '#ffffff' : 'var(--color-graphite)',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {a.displayName}
                </button>
              )
            })}
          </div>

          <div className="grid gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto]">
            <div>
              <Dial
                label="Çap"
                display={diameter >= 1000 ? trim(diameter / 1000) : trim(diameter)}
                unit={diameter >= 1000 ? 'km' : 'm'}
                sliderValue={diameterToSlider(diameter)}
                min={0}
                max={1000}
                step={1}
                onChange={(s) => setDiameter(sliderToDiameter(s))}
              />
              <Dial
                label="Çarpma hızı"
                display={trim(velocity)}
                unit="km/s"
                sliderValue={velocity}
                min={5}
                max={70}
                step={0.1}
                onChange={setVelocity}
              />
              <Dial
                label="Çarpma açısı (yataydan)"
                display={String(angle)}
                unit="derece"
                sliderValue={angle}
                min={15}
                max={90}
                step={1}
                onChange={setAngle}
              />
              <div className="field-label pt-1 leading-relaxed">
                Yoğunluk {selected.defaultDensityKgM3.toLocaleString('tr-TR')} kg/m³ · hedef kabuk
                2.500 kg/m³
              </div>
            </div>

            <div
              className="flex flex-row gap-8 self-start border-t pt-3 sm:flex-col sm:gap-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8"
              style={{ borderColor: 'var(--paper-line)' }}
            >
              <Result
                label="Açığa çıkan enerji"
                value={formatScaled(result.energyMegatons)}
                unit="megaton TNT"
              />
              <Result label="Tahmini krater çapı" value={trim(result.finalCraterKm)} unit="km" />
            </div>
          </div>

          <p
            className="mt-2 border-t pt-2 text-[0.7rem] leading-relaxed opacity-65"
            style={{ borderColor: 'var(--paper-line)', fontFamily: 'var(--font-voice)' }}
          >
            Enerji hesabı kesin fiziktir. Krater çapı, Collins, Melosh ve Marcus (2005) ölçekleme
            denklemine dayanan bir <em>tahmindir</em>; bilimsel kesinlik iddia etmez. Atmosferde
            parçalanma, hedef yüzeyin tipi ve karmaşık kraterlerin çöküşü hesaba katılmadı.
            {isClamped && ' Bu cismin gerçek çapı kaydırıcının üst sınırını aşıyor, değer kırpıldı.'}
          </p>
          <p
            className="pt-1 text-[0.7rem] leading-relaxed opacity-55"
            style={{ fontFamily: 'var(--font-voice)' }}
          >
            {selected.dataNote}
          </p>
        </div>
      </div>
    </div>
  )
}
