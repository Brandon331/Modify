/**
 * ============================================================
 *  MOODIFY — VIDEO DEMO WATCHER  (reescrito)
 *  Ejecutar con:  node video-demo.js
 *
 *  Observa CODIGO.js en tiempo real.
 *  Detecta FRAGMENTOS DE CÓDIGO REAL en lugar de palabras clave,
 *  así el video muestra código auténtico mientras se escribe.
 * ============================================================
 */

const fs   = require('fs')
const path = require('path')

const CODIGO_PATH = path.join(__dirname, 'CODIGO.js')
const SRC         = path.join(__dirname, 'src', 'renderer')

// ── Utilidad: escribir archivo solo si cambió ──
function write(filePath, content) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  if (current !== content) {
    fs.writeFileSync(filePath, content, 'utf8')
    const rel = path.relative(__dirname, filePath)
    console.log(`  ✓ actualizado → ${rel}`)
  }
}

// ── Leer archivos originales del proyecto ──
const APP_ORIGINAL      = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8')
const LIBRARY_ORIGINAL  = fs.readFileSync(path.join(SRC, 'pages', 'Library', 'Library.jsx'), 'utf8')
const PLAYER_ORIGINAL   = fs.readFileSync(path.join(SRC, 'pages', 'Player',  'Player.jsx'), 'utf8')

// ════════════════════════════════════════════════════════════
//  VERSIONES PROGRESIVAS DE App.jsx
// ════════════════════════════════════════════════════════════

// BASE — sin temas, sin moods, sin decoraciones
const APP_BASE = `import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Library from './pages/Library/Library'
import Player from './pages/Player/Player'
import './styles/globals.css'

export default function App() {
  return (
    <HashRouter>
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg0)',
      }}>
        <div style={{
          background: 'var(--bg1)', borderBottom: '2px solid var(--border)',
          padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: 'var(--accent)', fontSize: '12px' }}>♪</span>
          <span style={{ fontSize: '7px' }}>MOODIFY</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/"       element={<Library moods={[]} />} />
            <Route path="/player" element={<Player  moods={[]} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}
`

// STAGE 1 — THEMES: selector de colores
const APP_TEMAS = `import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Library from './pages/Library/Library'
import Player from './pages/Player/Player'
import './styles/globals.css'

const THEMES = [
  { id: 'rose',     label: '🌸 Rose',     emoji: '🌸' },
  { id: 'lavender', label: '💜 Lavender', emoji: '💜' },
  { id: 'peach',    label: '🍑 Peach',    emoji: '🍑' },
  { id: 'mint',     label: '🍃 Mint',     emoji: '🍃' },
  { id: 'sakura',   label: '🌺 Sakura',   emoji: '🌺' },
]

function TitleBar({ theme, setTheme, showTheme, setShowTheme }) {
  return (
    <div style={{
      background: 'var(--bg1)', borderBottom: '2px solid var(--border)',
      padding: '4px 8px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)', fontSize: '12px', animation: 'float 2s infinite' }}>♪</span>
        <span style={{ fontSize: '7px', color: 'var(--text)' }}>MOODIFY</span>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <button className="px-btn" style={{ fontSize: '8px', padding: '3px 6px' }}
            onClick={() => setShowTheme(v => !v)}>
            {THEMES.find(t => t.id === theme)?.emoji || '🎨'}
          </button>
          {showTheme && (
            <div style={{
              position: 'absolute', top: '100%', right: 0,
              background: 'var(--surface)', border: '2px solid var(--border)',
              boxShadow: '3px 3px 0 var(--shadow)', zIndex: 100, marginTop: 2, minWidth: 90,
            }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setTheme(t.id); setShowTheme(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '5px 8px', fontSize: '7px',
                    fontFamily: "'Press Start 2P', monospace",
                    background: theme === t.id ? 'var(--accent2)' : 'transparent',
                    color: 'var(--text)', border: 'none', cursor: 'pointer',
                    borderBottom: '1px solid var(--border2)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button style={{ width:10, height:10, background:'#ffbd2e', border:'1px solid #e09e00', cursor:'pointer', padding:0 }}
          onClick={() => window.api?.window?.minimize()} />
        <button style={{ width:10, height:10, background:'#27c93f', border:'1px solid #1aab2e', cursor:'pointer', padding:0 }}
          onClick={() => window.api?.window?.maximize()} />
        <button style={{ width:10, height:10, background:'#ff5f57', border:'1px solid #e0443e', cursor:'pointer', padding:0 }}
          onClick={() => window.api?.window?.close()} />
      </div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme]         = useState('rose')
  const [showTheme, setShowTheme] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'rose' ? '' : theme)
  }, [theme])

  return (
    <HashRouter>
      <div style={{ width:'100vw', height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg0)' }}
        onClick={() => showTheme && setShowTheme(false)}>
        <TitleBar theme={theme} setTheme={setTheme} showTheme={showTheme} setShowTheme={setShowTheme} />
        <div style={{ flex:1, overflow:'hidden' }}>
          <Routes>
            <Route path="/"       element={<Library moods={[]} />} />
            <Route path="/player" element={<Player  moods={[]} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}
`

// STAGE 2 — MOODS: chips visibles
const APP_MOODS = APP_TEMAS
  .replace("import './styles/globals.css'", `import { useMoodStore } from './store/moodStore'
import './styles/globals.css'`)
  .replace("const THEMES = [", `const MOODS = [
  { id: 'feliz',      emoji: '☀️',  label: 'Feliz'      },
  { id: 'romantica',  emoji: '🌹',  label: 'Romántica'  },
  { id: 'relajante',  emoji: '🌿',  label: 'Relajante'  },
  { id: 'triste',     emoji: '💙',  label: 'Triste'     },
  { id: 'tension',    emoji: '⚡',  label: 'Tensión'    },
  { id: 'gym',        emoji: '🔥',  label: 'Gym'        },
  { id: 'nostalgica', emoji: '🍂',  label: 'Nostálgica' },
]

const THEMES = [`)
  .replace(
    "  const [showTheme, setShowTheme] = useState(false)\n\n  useEffect",
    `  const [showTheme, setShowTheme] = useState(false)
  const currentMood = useMoodStore(s => s.currentMood)

  useEffect`
  )
  .replace(
    "<TitleBar theme={theme} setTheme={setTheme} showTheme={showTheme} setShowTheme={setShowTheme} />",
    `<TitleBar theme={theme} setTheme={setTheme} showTheme={showTheme} setShowTheme={setShowTheme} />
        <div style={{ display:'flex', gap:4, padding:'4px 8px', background:'var(--bg0)', flexWrap:'wrap', flexShrink:0 }}>
          {MOODS.map(m => (
            <span key={m.id} style={{
              fontSize:'6px', padding:'3px 7px',
              background: currentMood === m.id ? 'var(--accent)' : 'var(--surface)',
              color: currentMood === m.id ? '#fff' : 'var(--text)',
              border:'1px solid var(--border)', boxShadow:'1px 1px 0 var(--shadow)',
            }}>{m.emoji} {m.label}</span>
          ))}
        </div>`
  )
  .replace(
    "element={<Library moods={[]} />}",
    "element={<Library moods={MOODS} />}"
  )
  .replace(
    "element={<Player  moods={[]} />}",
    "element={<Player  moods={MOODS} />}"
  )

// STAGE 3 — DECOS: ✦ y ♥ pixel
const APP_DECOS = APP_MOODS.replace(
  "function TitleBar",
  `function PixelDeco() {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
      {[
        { top:'8%',    left:'5%',  delay:'0s'   },
        { top:'15%',   right:'8%', delay:'0.5s' },
        { top:'60%',   left:'3%',  delay:'1s'   },
        { bottom:'20%',right:'5%', delay:'1.5s' },
        { top:'40%',   left:'92%', delay:'0.3s' },
      ].map((s, i) => (
        <span key={i} style={{
          position:'absolute', ...s,
          fontSize:'10px', animation:\`twinkle 2s \${s.delay} infinite\`,
          color:'var(--star)',
        }}>✦</span>
      ))}
      {[
        { top:'25%',    left:'7%', delay:'0.7s' },
        { bottom:'35%', right:'6%',delay:'1.2s' },
      ].map((s, i) => (
        <span key={i} style={{
          position:'absolute', ...s,
          fontSize:'8px', animation:\`heartbeat 1.5s \${s.delay} infinite\`,
          color:'var(--accent2)',
        }}>♥</span>
      ))}
    </div>
  )
}

function TitleBar`
).replace(
  "<TitleBar theme={theme}",
  `<PixelDeco />
        <TitleBar theme={theme}`
).replace(
  "display:'flex', flexDirection:'column', background:'var(--bg0)'",
  "display:'flex', flexDirection:'column', position:'relative', overflow:'hidden'"
)

// STAGE 4 — FONDO ANIMADO
const APP_FONDO = APP_DECOS
  .replace(
    "import { useMoodStore }",
    `import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground'
import { useMoodStore }`
  )
  .replace(
    "<PixelDeco />",
    `{/* 🌅 Fondo animado por mood */}
      <AnimatedBackground mood={activeMood} />
      <PixelDeco />`
  )
  .replace(
    "  const currentMood = useMoodStore(s => s.currentMood)\n\n  useEffect",
    `  const currentMood = useMoodStore(s => s.currentMood)
  const activeMood  = currentMood === 'default' ? 'romantica' : currentMood

  useEffect`
  )

// STAGE 5 — NUBE (cloud en PixelDeco)
const APP_NUBE = APP_FONDO.replace(
  "    </div>\n  )\n}\n\nfunction TitleBar",
  `      <div style={{
        position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
        animation: 'float 3s ease-in-out infinite',
        fontSize: '24px', color: 'var(--cloud)',
      }}>☁</div>
    </div>
  )
}

function TitleBar`
)

// STAGE 6 — BIBLIOTECA (Library con header animado)
const LIBRARY_DEMO = LIBRARY_ORIGINAL
  .replace(
    "tracks.length > 0\n              ? `",
    "tracks.length > 0\n              ? `✦ "
  )
  .replace(
    "style={{ fontSize:'9px', padding:'8px 14px', marginTop:6 }}",
    "style={{ fontSize:'8px', padding:'8px 14px', marginTop:6, animation:'heartbeat 2s ease-in-out infinite' }}"
  )

// STAGE 7 — REPRODUCTOR (más barras en el visualizador)
const PLAYER_DEMO = PLAYER_ORIGINAL
  .replace(
    "Array.from({ length: 16 }).map((_, i) => (",
    "Array.from({ length: 24 }).map((_, i) => ("
  )
  .replace(
    "width: 3,",
    "width: 4,"
  )

// ════════════════════════════════════════════════════════════
//  DETECTORES — fragmentos de código real → stage
// ════════════════════════════════════════════════════════════

const DETECTORS = [
  {
    name: 'COMPLETO',
    // Stage 8: carga la librería real
    detect: (code) => /useLibraryStore\(loadLibrary\)|useLibraryStore\(s\s*=>\s*s\.loadLibrary\)/.test(code),
    apply: () => {
      console.log('\n✅ [8/8] COMPLETO — App.jsx real restaurado')
      write(path.join(SRC, 'App.jsx'), APP_ORIGINAL)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_DEMO)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_DEMO)
    },
  },
  {
    name: 'REPRODUCTOR',
    // Stage 7: Array.from({ length: 24 }) — visualizador con más barras
    detect: (code) => /Array\.from\(\s*\{\s*length:\s*24\s*\}/.test(code),
    apply: () => {
      console.log('\n▶  [7/8] REPRODUCTOR — visualizador de 24 barras activado')
      write(path.join(SRC, 'App.jsx'), APP_NUBE)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_DEMO)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_DEMO)
    },
  },
  {
    name: 'BIBLIOTECA',
    // Stage 6: tracks.length === 0 dentro del código
    detect: (code) => /tracks\.length\s*===\s*0/.test(code),
    apply: () => {
      console.log('\n📚 [6/8] BIBLIOTECA — header animado activado')
      write(path.join(SRC, 'App.jsx'), APP_NUBE)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_DEMO)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    },
  },
  {
    name: 'NUBE',
    // Stage 5: <AnimatedBackground mood=... está presente
    detect: (code) => /<AnimatedBackground\s+mood=/.test(code),
    apply: () => {
      console.log('\n☁  [5/8] NUBE — fondo + cloud sprite activado')
      write(path.join(SRC, 'App.jsx'), APP_NUBE)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_ORIGINAL)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    },
  },
  {
    name: 'FONDO',
    // Stage 4: import AnimatedBackground está presente (pero no el <AnimatedBackground mood=)
    detect: (code) => /import\s+AnimatedBackground/.test(code),
    apply: () => {
      console.log('\n🌅 [4/8] FONDO — AnimatedBackground importado')
      write(path.join(SRC, 'App.jsx'), APP_FONDO)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_ORIGINAL)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    },
  },
  {
    name: 'DECOS',
    // Stage 3: function PixelDeco() presente
    detect: (code) => /function\s+PixelDeco\s*\(/.test(code),
    apply: () => {
      console.log('\n✦  [3/8] DECOS — estrellas y corazones pixel activados')
      write(path.join(SRC, 'App.jsx'), APP_DECOS)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_ORIGINAL)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    },
  },
  {
    name: 'MOODS',
    // Stage 2: const MOODS = [ presente
    detect: (code) => /const\s+MOODS\s*=\s*\[/.test(code),
    apply: () => {
      console.log('\n🎵 [2/8] MOODS — 7 chips de mood activados')
      write(path.join(SRC, 'App.jsx'), APP_MOODS)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_ORIGINAL)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    },
  },
  {
    name: 'TEMAS',
    // Stage 1: const THEMES = [ presente
    detect: (code) => /const\s+THEMES\s*=\s*\[/.test(code),
    apply: () => {
      console.log('\n🎨 [1/8] TEMAS — selector de colores activado')
      write(path.join(SRC, 'App.jsx'), APP_TEMAS)
      write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_ORIGINAL)
      write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    },
  },
]

// ════════════════════════════════════════════════════════════
//  MOTOR DE DETECCIÓN
// ════════════════════════════════════════════════════════════

let lastStage = -1

function applyChanges(codigo) {
  // Encuentra el stage más alto que matchee (orden DETECTORS = mayor a menor)
  for (let i = 0; i < DETECTORS.length; i++) {
    if (DETECTORS[i].detect(codigo)) {
      if (lastStage !== i) {
        lastStage = i
        DETECTORS[i].apply()
      }
      return
    }
  }

  // Sin ningún fragmento → estado base
  if (lastStage !== -1) {
    console.log('\n⬜ Sin código → estado base')
    write(path.join(SRC, 'App.jsx'), APP_BASE)
    write(path.join(SRC, 'pages', 'Library', 'Library.jsx'), LIBRARY_ORIGINAL)
    write(path.join(SRC, 'pages', 'Player',  'Player.jsx'), PLAYER_ORIGINAL)
    lastStage = -1
  }
}

// ════════════════════════════════════════════════════════════
//  ARRANQUE Y WATCHER
// ════════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════════════════╗')
console.log('║  MOODIFY — VIDEO DEMO WATCHER                        ║')
console.log('║  Detecta código real en CODIGO.js                    ║')
console.log('╠══════════════════════════════════════════════════════╣')
console.log('║  Fragmentos que activan cada stage:                  ║')
console.log('║  1. const THEMES = [        → selector de temas      ║')
console.log('║  2. const MOODS  = [        → chips de mood          ║')
console.log('║  3. function PixelDeco()    → ✦ decos pixel          ║')
console.log('║  4. import AnimatedBackground → fondo animado        ║')
console.log('║  5. <AnimatedBackground mood= → nube flotante        ║')
console.log('║  6. tracks.length === 0     → biblioteca             ║')
console.log('║  7. Array.from({ length: 24 }) → visualizador        ║')
console.log('║  8. useLibraryStore(loadLibrary) → app completo      ║')
console.log('╚══════════════════════════════════════════════════════╝')
console.log('')

// Aplicar estado inicial
const initialCode = fs.readFileSync(CODIGO_PATH, 'utf8')
applyChanges(initialCode)

// Iniciar watcher
fs.watch(CODIGO_PATH, { persistent: true }, (event) => {
  if (event !== 'change') return
  try {
    const codigo = fs.readFileSync(CODIGO_PATH, 'utf8')
    applyChanges(codigo)
  } catch (_) {
    // Archivo en uso momentáneamente, ignorar
  }
})

console.log('\n👀 Esperando cambios en CODIGO.js ...\n')
