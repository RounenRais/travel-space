import { create } from 'zustand'
import { BODIES_BY_ID } from './content'
import type { Body } from './types'

type Mode = 'overview' | 'focus'

interface TourState {
  mode: Mode
  focusedId: string | null
  /** Odaklanılan cismin diyalog dizisindeki satır indeksi. */
  lineIndex: number
  /** Bu oturumda açılmış opsiyonel içerikler (ör. 'far-side'). */
  revealed: Set<string>
  simulationOpen: boolean
  hoveredId: string | null
  visited: Set<string>

  focus: (id: string) => void
  advance: () => void
  exitFocus: () => void
  setHovered: (id: string | null) => void
  reveal: (key: string) => void
  openSimulation: () => void
  closeSimulation: () => void
}

export const useTour = create<TourState>((set, get) => ({
  mode: 'overview',
  focusedId: null,
  lineIndex: 0,
  revealed: new Set(),
  simulationOpen: false,
  hoveredId: null,
  visited: new Set(),

  focus: (id) => {
    if (!BODIES_BY_ID[id]) return
    set((s) => ({
      mode: 'focus',
      focusedId: id,
      lineIndex: 0,
      simulationOpen: false,
      hoveredId: null,
      visited: new Set(s.visited).add(id),
    }))
  },

  advance: () => {
    const { focusedId, lineIndex } = get()
    if (!focusedId) return
    const body = BODIES_BY_ID[focusedId]
    if (lineIndex < body.dialogue.length - 1) {
      set({ lineIndex: lineIndex + 1 })
    }
  },

  exitFocus: () =>
    set({ mode: 'overview', focusedId: null, lineIndex: 0, simulationOpen: false }),

  setHovered: (id) => set({ hoveredId: id }),

  reveal: (key) => set((s) => ({ revealed: new Set(s.revealed).add(key) })),

  openSimulation: () => set({ simulationOpen: true }),
  closeSimulation: () => set({ simulationOpen: false }),
}))

/** Odaklanılan cisim ve o anki replik — bileşenlerde sık gerekiyor. */
export function useFocused(): { body: Body | null; line: number } {
  const focusedId = useTour((s) => s.focusedId)
  const line = useTour((s) => s.lineIndex)
  return { body: focusedId ? BODIES_BY_ID[focusedId] : null, line }
}
