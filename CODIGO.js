const THEMES = [
  { id: 'rose', label: '🌸 Rose', emoji : '🌸'},
  { id: 'lavender', label: '💜 Lavender', emoji : '💜'},
  { id: 'peach', label: ' 🍑 Peach', emoji: '🍑'},
  { id: 'mint', label: '🍃 Mint', emoji :'🍃'},
  { id: 'sakura', label: '🌺 Sakura', emoji: '🌺'}
]
const MOODS = [
  {id: 'feliz', emoji: '☀️', label : 'Feliz'},
  {id: 'romantica', emoji: '🌹', label : 'Romantica'},
  {id: 'relajante', emoji: '🌿', label : 'Relajante'},
  {id: 'triste', emoji: '💙', label : 'Triste'},
  {id: 'tension', emoji: '⚡', label : 'Tension'},
  {id: 'gym', emoji: '🔥', label : 'Gym'},
  {id: 'nostalgica', emoji: '🍂', label : 'Nostalgica'},

]

function PixelDeco() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {[
        { top: '8%',    left: '5%',  delay: '0s'   },
        { top: '15%',   right: '8%', delay: '0.5s' },
        { top: '60%',   left: '3%',  delay: '1s'   },
        { bottom:'20%', right: '5%', delay: '1.5s' },
      ].map((s, i) => (
        <span key={i} style={{
          position: 'absolute', ...s,
          fontSize: '10px',
          animation: `twinkle 2s ${s.delay} infinite`,
          color: 'var(--star)',
        }}>✦</span>
      ))}
      {[
        { top: '25%',    left: '7%', delay: '0.7s' },
        { bottom: '35%', right: '6%',delay: '1.2s' },
      ].map((s, i) => (
        <span key={i} style={{
          position: 'absolute', ...s,
          fontSize: '8px',
          animation: `heartbeat 1.5s ${s.delay} infinite`,
          color: 'var(--accent2)',
        }}>♥</span>
      ))}
    </div>
  )
}

import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground'

<AnimatedBackground mood={activedMood} />

tracks.length === 0

Array.from({length:24}).map((_, i) => (
  useLibraryStore(loadLibrary)
))