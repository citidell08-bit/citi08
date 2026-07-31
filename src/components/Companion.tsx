import { companionStage, STAGE_LABELS } from '../lib/xp'
import './Companion.css'

interface Props {
  name: string
  level: number
  size?: 'lg' | 'md'
}

export function Companion({ name, level, size = 'lg' }: Props) {
  const stage = companionStage(level)
  const label = STAGE_LABELS[stage]

  return (
    <div className={`companion companion-${size} stage-${stage}`} aria-label={`${name}, ${label}`}>
      <div className="companion-glow" />
      <svg className="companion-svg" viewBox="0 0 200 200" role="img">
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#4aa882" />
            <stop offset="70%" stopColor="#1f4d3f" />
            <stop offset="100%" stopColor="#0c2420" />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#d7efe4" />
            <stop offset="100%" stopColor="#7eb89d" />
          </radialGradient>
        </defs>

        {/* Wings */}
        <ellipse className="wing wing-l" cx="48" cy="108" rx="28" ry="42" fill="#5eead4" opacity="0.55" />
        <ellipse className="wing wing-r" cx="152" cy="108" rx="28" ry="42" fill="#5eead4" opacity="0.55" />

        {/* Body */}
        <ellipse cx="100" cy="118" rx="52" ry="58" fill="url(#bodyGrad)" />
        <ellipse cx="100" cy="128" rx="30" ry="34" fill="url(#bellyGrad)" opacity="0.85" />

        {/* Ears / tufts grow with stage */}
        {stage >= 2 && (
          <>
            <path d="M70 70 L62 42 L84 62 Z" fill="#3d8b6e" />
            <path d="M130 70 L138 42 L116 62 Z" fill="#3d8b6e" />
          </>
        )}

        {/* Face */}
        <circle cx="100" cy="88" r="38" fill="#2a6b55" />
        <circle className="eye" cx="84" cy="86" r="9" fill="#e8f2ed" />
        <circle className="eye" cx="116" cy="86" r="9" fill="#e8f2ed" />
        <circle cx="86" cy="87" r="3.5" fill="#061412" />
        <circle cx="118" cy="87" r="3.5" fill="#061412" />
        <path
          d="M94 100 Q100 106 106 100"
          stroke="#f0b429"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Ember crest for higher stages */}
        {stage >= 3 && (
          <path
            className="crest"
            d="M100 42 C108 58 118 62 100 78 C82 62 92 58 100 42 Z"
            fill="#f0b429"
          />
        )}

        {/* Sage halo */}
        {stage >= 4 && (
          <ellipse
            className="halo"
            cx="100"
            cy="48"
            rx="34"
            ry="10"
            fill="none"
            stroke="#5eead4"
            strokeWidth="3"
            opacity="0.8"
          />
        )}

        {/* Feet */}
        <path d="M82 168 Q78 178 88 178" stroke="#f0b429" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M118 168 Q122 178 112 178" stroke="#f0b429" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>

      <div className="companion-meta">
        <strong>{name}</strong>
        <span>
          Lv {level} · {label}
        </span>
      </div>
    </div>
  )
}
