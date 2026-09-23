import { useEffect, useRef, useState } from 'react'

/**
 * Metni karakter karakter yazar. `skip()` çağrılırsa anında tamamlar —
 * ikinci kez tıklayan kullanıcıyı bekletmek can sıkıcı olur.
 */
export function useTypewriter(text: string, charsPerSecond = 46) {
  // Yazılan miktarı hangi metne ait olduğuyla birlikte tutuyoruz; böylece
  // metin değişince sayacı efektte sıfırlamak gerekmiyor. Efektle sıfırlamak
  // araya eski repliğin tam hâlinin göründüğü bir kare sokuyordu.
  const [typed, setTyped] = useState({ text, count: 0 })
  const frame = useRef<number>(0)

  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (reduced || !text) return

    let start: number | null = null
    const step = (now: number) => {
      if (start === null) start = now
      const count = Math.min(text.length, Math.floor(((now - start) / 1000) * charsPerSecond))
      setTyped({ text, count })
      if (count < text.length) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame.current)
  }, [text, charsPerSecond, reduced])

  // Metin daha yeni değiştiyse efekt henüz çalışmamıştır; o karede sayaç 0.
  const count = reduced ? text.length : typed.text === text ? typed.count : 0
  const shown = text.slice(0, count)
  const done = count >= text.length

  const skip = () => {
    cancelAnimationFrame(frame.current)
    setTyped({ text, count: text.length })
  }

  return { shown, done, skip }
}
