import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import Library from './pages/Library/Library'
import Player from './pages/Player/Player'
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground'
import { useLibraryStore } from './store/libraryStore'
import { useMoodStore } from './store/moodStore'
import { useDragWindow } from './hooks/useDragWindow'
import './styles/globals.css'

const THEMES = [
  { id: 'rose',     label: '🌸 Rose',     emoji: '🌸' },
  { id: 'lavender', label: '💜 Lavender', emoji: '💜' },
  { id: 'peach',    label: '🍑 Peach',   emoji: '🍑' },
  { id: 'mint',     label: '🍃 Mint',     emoji: '🍃' },
  { id: 'sakura',   label: '🌺 Sakura',   emoji: '🌺' },
]

const MOODS = [
  { id: 'feliz',      emoji: '☀️',  label: 'Feliz' },
  { id: 'romantica',  emoji: '🌹',  label: 'Romántica' },
  { id: 'relajante',  emoji: '🌿',  label: 'Relajante' },
  { id: 'triste',     emoji: '💙',  label: 'Triste' },
  { id: 'tension',    emoji: '⚡',  label: 'Tensión' },
  { id: 'gym',        emoji: '🔥',  label: 'Gym' },
  { id: 'nostalgica', emoji: '🍂',  label: 'Nostálgica' },
]

// Pixel decorations
function PixelDeco() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {[
        { top: '8%',    left:  '5%',  delay: '0s'   },
        { top: '15%',   right: '8%',  delay: '0.5s' },
        { top: '60%',   left:  '3%',  delay: '1s'   },
        { bottom:'20%', right: '5%',  delay: '1.5s' },
        { top: '40%',   left:  '92%', delay: '0.3s' },
      ].map((s, i) => (
        <span key={i} style={{
          position: 'absolute', ...s,
          fontSize: '10px', animation: `twinkle 2s ${s.delay} infinite`,
          color: 'var(--star)',
        }}>✦</span>
      ))}
      {[
        { top: '25%',    left:  '7%', delay: '0.7s' },
        { bottom: '35%', right: '6%', delay: '1.2s' },
      ].map((s, i) => (
        <span key={i} style={{
          position: 'absolute', ...s,
          fontSize: '8px', animation: `heartbeat 1.5s ${s.delay} infinite`,
          color: 'var(--accent2)',
        }}>♥</span>
      ))}
      <div style={{
        position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
        animation: 'float 3s ease-in-out infinite',
        fontSize: '24px', color: 'var(--cloud)',
      }}>☁</div>
    </div>
  )
}

function TitleBar({ theme, setTheme, showTheme, setShowTheme }) {


  return (
    <div

      style={{
        background: 'var(--bg1)',
        borderBottom: '2px solid var(--border)',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        userSelect: 'none',
        WebkitAppRegion: 'drag',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)', fontSize: '12px', animation: 'float 2s infinite' }}>♪</span>
        <span style={{ fontSize: '7px', color: 'var(--text)', letterSpacing: 0 }}>MOODIFY</span>
        <span style={{ color: 'var(--star)', fontSize: '8px', animation: 'twinkle 1.5s infinite' }}>★</span>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
        {/* Theme picker */}
        <div style={{ position: 'relative' }}>
          <button className="px-btn" style={{ fontSize: '8px', padding: '3px 6px' }}
            onClick={() => setShowTheme(v => !v)}>
            {THEMES.find(t => t.id === theme)?.emoji || '🎨'}
          </button>
          {showTheme && (
            <div style={{
              position: 'absolute', top: '100%', right: 0,
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              boxShadow: '3px 3px 0 var(--shadow)',
              zIndex: 100, marginTop: 2, minWidth: 90,
            }}>
              {THEMES.map(t => (
                <button key={t.id}
                  onClick={() => { setTheme(t.id); setShowTheme(false) }}
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
        {/* Window controls */}
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

function AppInner() {
  const [theme, setTheme]         = useState('rose')
  const [showTheme, setShowTheme] = useState(false)
  const loadLibrary = useLibraryStore(s => s.loadLibrary)
  const currentMood = useMoodStore(s => s.currentMood)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'rose' ? '' : theme)
  }, [theme])

  useEffect(() => { loadLibrary() }, [])

  // Mood normalizado: si es 'default' no cargamos fondo específico
  const activeMood = currentMood === 'default' ? 'romantica' : currentMood

  // Cuando cambia el mood → sobreescribir las CSS vars de color inmediatamente
  useEffect(() => {
    const root = document.documentElement.style
    const MOOD_VARS = {
      romantica: {
        '--bg0': '#fce4ec', '--bg1': '#f8bbd0', '--bg2': '#f48fb1',
        '--surface': '#fff0f5', '--surface2': '#ffe4ef',
        '--border': '#d63384', '--border2': '#f06292',
        '--text': '#4a0a2a', '--text2': '#8b2252',
        '--accent': '#e91e8c', '--accent2': '#ff80ab',
        '--star': '#ffb300', '--cloud': '#ce93d8', '--shadow': '#d63384',
      },
      gym: {
        '--bg0': '#1a0033', '--bg1': '#2d0052', '--bg2': '#4a0080',
        '--surface': '#260040', '--surface2': '#380060',
        '--border': '#9c27b0', '--border2': '#ce93d8',
        '--text': '#f3e5f5', '--text2': '#e1bee7',
        '--accent': '#ab47bc', '--accent2': '#ce93d8',
        '--star': '#ffd740', '--cloud': '#9c27b0', '--shadow': '#6a0080',
      },
      triste: {
        '--bg0': '#0d1b2e', '--bg1': '#1a2f4a', '--bg2': '#1e3a5f',
        '--surface': '#152238', '--surface2': '#1c2e47',
        '--border': '#1565c0', '--border2': '#42a5f5',
        '--text': '#e3f2fd', '--text2': '#bbdefb',
        '--accent': '#1976d2', '--accent2': '#64b5f6',
        '--star': '#b3e5fc', '--cloud': '#42a5f5', '--shadow': '#0d47a1',
      },
      feliz: {
        '--bg0': '#fff8e1', '--bg1': '#ffecb3', '--bg2': '#ffe082',
        '--surface': '#fffdf0', '--surface2': '#fff9e0',
        '--border': '#f57f17', '--border2': '#ffb300',
        '--text': '#3e2700', '--text2': '#7a4f00',
        '--accent': '#ff8f00', '--accent2': '#ffd54f',
        '--star': '#fff176', '--cloud': '#ffe082', '--shadow': '#e65100',
      },
      relajante: {
        '--bg0': '#e8f5e9', '--bg1': '#c8e6c9', '--bg2': '#a5d6a7',
        '--surface': '#f1f8f2', '--surface2': '#e4f4e5',
        '--border': '#2e7d32', '--border2': '#66bb6a',
        '--text': '#0a1f0b', '--text2': '#1b5e20',
        '--accent': '#388e3c', '--accent2': '#81c784',
        '--star': '#fff176', '--cloud': '#a5d6a7', '--shadow': '#1b5e20',
      },
      nostalgica: {
        '--bg0': '#2b1a0e', '--bg1': '#3e2612', '--bg2': '#5a3a1a',
        '--surface': '#332010', '--surface2': '#422a15',
        '--border': '#bf6c2a', '--border2': '#e8913e',
        '--text': '#fbe9d0', '--text2': '#f5c99a',
        '--accent': '#d4722a', '--accent2': '#f0a060',
        '--star': '#ffd180', '--cloud': '#e8913e', '--shadow': '#7c3d10',
      },
      tension: {
        '--bg0': '#0d0d1a', '--bg1': '#1a1a2e', '--bg2': '#16213e',
        '--surface': '#111120', '--surface2': '#1c1c30',
        '--border': '#5c3d8f', '--border2': '#9b5de5',
        '--text': '#e8e0f5', '--text2': '#c8b8e8',
        '--accent': '#7c3aed', '--accent2': '#a78bfa',
        '--star': '#e040fb', '--cloud': '#7c3aed', '--shadow': '#3b1f6b',
      },
    }
    const vars = MOOD_VARS[activeMood] || MOOD_VARS.romantica
    Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v))
  }, [activeMood])

  return (
    <div
      style={{
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => showTheme && setShowTheme(false)}
    >
      {/* Fondo animado + sprite nube — detrás de todo */}
      <AnimatedBackground mood={activeMood} />

      {/* Decoraciones pixel sobre el fondo */}
      <PixelDeco />

      {/* Barra de título */}
      <TitleBar theme={theme} setTheme={setTheme} showTheme={showTheme} setShowTheme={setShowTheme} />

      {/* Contenido de rutas */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/"        element={<Library moods={MOODS} />} />
          <Route path="/player"  element={<Player  moods={MOODS} />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  )
}
