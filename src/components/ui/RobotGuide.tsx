/**
 * Rehber. Bilinçli olarak 2B ve sade: birkaç temel geometrik biçim,
 * gerçekçilik denemesi yok. Konuşurken tek gözü nabız gibi canlanıyor —
 * karakteri veren şey ayrıntı değil, o küçük hareket.
 */
export function RobotGuide({ speaking }: { speaking: boolean }) {
  return (
    <svg viewBox="0 0 88 104" className="h-full w-full" role="img" aria-label="Robot rehber">
      <defs>
        <clipPath id="visor-clip">
          <rect x="17" y="27" width="54" height="30" rx="12" />
        </clipPath>
      </defs>

      {/* gövde/boyun */}
      <path d="M36 78h16v9a8 8 0 0 1-8 8 8 8 0 0 1-8-8z" fill="#8a9099" />
      <path d="M22 104c2-9 10-14 22-14s20 5 22 14z" fill="#6f767f" />

      {/* kafa kasası */}
      <rect x="10" y="14" width="68" height="64" rx="16" fill="#aeb5bd" />
      <rect x="10" y="14" width="68" height="64" rx="16" fill="none" stroke="#5c636c" strokeWidth="2" />
      {/* perçin sırası — panel hissi */}
      <g fill="#7d848d">
        <circle cx="18" cy="22" r="1.7" />
        <circle cx="70" cy="22" r="1.7" />
        <circle cx="18" cy="70" r="1.7" />
        <circle cx="70" cy="70" r="1.7" />
      </g>

      {/* vizör */}
      <rect x="17" y="27" width="54" height="30" rx="12" fill="#14202f" />
      <g clipPath="url(#visor-clip)">
        <rect x="17" y="27" width="54" height="9" fill="#ffffff" opacity="0.07" />
      </g>
      <rect
        x="17"
        y="27"
        width="54"
        height="30"
        rx="12"
        fill="none"
        stroke="#5c636c"
        strokeWidth="1.5"
      />

      {/* tek göz */}
      <circle
        cx="44"
        cy="42"
        r="3.4"
        fill="#c4372b"
        className={speaking ? 'guide-eye-live' : undefined}
        opacity={speaking ? 1 : 0.7}
      />
      <circle cx="44" cy="42" r="8.5" fill="none" stroke="#c4372b" strokeWidth="1" opacity="0.35" />

      {/* hoparlör ızgarası */}
      <g fill="#7d848d">
        <rect x="34" y="63" width="20" height="1.8" rx="0.9" />
        <rect x="37" y="67" width="14" height="1.8" rx="0.9" />
      </g>

      {/* anten */}
      <path d="M44 14V6" stroke="#5c636c" strokeWidth="2" strokeLinecap="round" />
      <circle cx="44" cy="4" r="3.2" fill={speaking ? '#c4372b' : '#7d848d'} />
    </svg>
  )
}
