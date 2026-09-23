import { Scene } from './components/Scene'
import { DialogueCard } from './components/ui/DialogueCard'
import { ImpactWorksheet } from './components/ui/ImpactWorksheet'
import {
  LoadingCard,
  OverviewHint,
  StopRail,
  TelemetryPanel,
  TopStrip,
} from './components/ui/Chrome'
import { useFocused, useTour } from './store'
import { isAsteroid } from './types'

export default function App() {
  const { body } = useFocused()
  const simulationOpen = useTour((s) => s.simulationOpen)

  const showWorksheet = body !== null && isAsteroid(body) && simulationOpen

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 3B sahne pencere; arayüzün tamamı onun üstüne serilmiş kâğıt ve metal. */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      <LoadingCard />

      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <TopStrip />

        <div className="flex min-h-0 flex-1">
          <div className="hidden sm:flex">
            <StopRail />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-end p-3 sm:p-4">
            {body && (
              <div className="flex justify-end pb-3">
                <TelemetryPanel body={body} />
              </div>
            )}

            {!body && <OverviewHint />}

            {showWorksheet ? (
              <ImpactWorksheet body={body} />
            ) : (
              body && <DialogueCard body={body} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
