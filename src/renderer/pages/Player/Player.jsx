import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../store/playerStore'
import { useLibraryStore } from '../../store/libraryStore'
import { useMoodStore } from '../../store/moodStore'
import CloudSprite from '../../components/CloudSprite/CloudSprite'

const MOOD_COLORS = {
  feliz:      '#f9c74f',
  romantica:  '#e8698a',
  relajante:  '#52b788',
  triste:     '#4a90d9',
  tension:    '#9b5de5',
  gym:        '#ff4d4d',
  nostalgica: '#e07a5f',
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/* ── Iconos SVG pixel art — no usan color del sistema operativo ─────────── */
function IconPrev() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', imageRendering: 'pixelated', fill: 'currentColor' }}>
      <rect x="0" y="1" width="2" height="10" />
      <polygon points="10,1 10,11 2,6" />
    </svg>
  )
}

function IconNext() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', imageRendering: 'pixelated', fill: 'currentColor' }}>
      <rect x="10" y="1" width="2" height="10" />
      <polygon points="2,1 2,11 10,6" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', imageRendering: 'pixelated', fill: 'currentColor' }}>
      <rect x="1" y="1" width="4" height="14" />
      <rect x="9" y="1" width="4" height="14" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', imageRendering: 'pixelated', fill: 'currentColor' }}>
      <polygon points="1,1 1,15 13,8" />
    </svg>
  )
}

function IconVolume({ level }) {
  // 0 = mute, 1 = low, 2 = high
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', imageRendering: 'pixelated', fill: 'currentColor' }}>
      {/* Altavoz base */}
      <rect x="0" y="4" width="3" height="4" />
      <polygon points="3,4 3,8 7,11 7,1" />
      {/* Onda 1 — siempre que no sea mute */}
      {level >= 1 && <path d="M8 4 Q10 6 8 8" stroke="currentColor" strokeWidth="1.5" fill="none" />}
      {/* Onda 2 — solo volumen alto */}
      {level >= 2 && <path d="M10 2 Q13 6 10 10" stroke="currentColor" strokeWidth="1.5" fill="none" />}
      {/* X de mute */}
      {level === 0 && <>
        <line x1="9" y1="4" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <line x1="13" y1="4" x2="9"  y2="8" stroke="currentColor" strokeWidth="1.5" />
      </>}
    </svg>
  )
}

function PixelBars({ isPlaying, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', gap: 1, height: 14, width: '100%',
    }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{
          width: 3,
          background: color || 'var(--accent)',
          border: '1px solid var(--border)',
          height: isPlaying ? undefined : 3,
          minHeight: 3,
          animation: isPlaying
            ? `bounce ${0.3 + (i % 5) * 0.1}s ${(i * 0.07) % 0.5}s ease-in-out infinite`
            : 'none',
          imageRendering: 'pixelated',
        }} />
      ))}
    </div>
  )
}

/* ── Texto con vibración pixel ──────────────────────────────────────────────
   En lugar de marquee (slide lateral), las letras tiemblan ligeramente
   con un offset aleatorio por caracter — efecto "glitch suave".          */
function PixelTitle({ text }) {
  return (
    <div style={{
      fontSize: 9,
      color: 'var(--text)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
    }}>
      {Array.from(`♪ ${text} ♪`).map((ch, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animation: `pixelVibrate ${0.18 + (i % 7) * 0.04}s ${(i * 0.03) % 0.3}s ease-in-out infinite alternate`,
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </div>
  )
}

export default function Player({ moods }) {
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const [resolvedUrl, setResolvedUrl] = useState(null)

  const currentTrack  = usePlayerStore((s) => s.currentTrack)
  const isPlaying     = usePlayerStore((s) => s.isPlaying)
  const progress      = usePlayerStore((s) => s.progress)
  const duration      = usePlayerStore((s) => s.duration)
  const volume        = usePlayerStore((s) => s.volume)
  const queue         = usePlayerStore((s) => s.queue)
  const queueIndex    = usePlayerStore((s) => s.queueIndex)

  const setIsPlaying    = usePlayerStore((s) => s.setIsPlaying)
  const setProgress     = usePlayerStore((s) => s.setProgress)
  const setDuration     = usePlayerStore((s) => s.setDuration)
  const setVolume       = usePlayerStore((s) => s.setVolume)
  const setCurrentTrack = usePlayerStore((s) => s.setCurrentTrack)
  const nextTrack       = usePlayerStore((s) => s.nextTrack)
  const prevTrack       = usePlayerStore((s) => s.prevTrack)

  const getTrackById = useLibraryStore((s) => s.getTrackById)
  const currentMood  = useMoodStore((s) => s.currentMood)
  const setMood      = useMoodStore((s) => s.setMood)

  const mood      = moods.find((m) => m.id === currentMood)
  const moodColor = MOOD_COLORS[currentMood] || 'var(--accent)'

  // Nombre limpio: sin extensión ni ruta
  const rawName   = currentTrack?.name || ''
  const trackName = rawName.replace(/\.[^.]+$/, '').replace(/.*[\\/]/, '')

  useEffect(() => {
    if (!currentTrack) return
    let objectUrl = null
    window.api.library.getPath(currentTrack.id).then(async (filePath) => {
      if (!filePath) return
      try {
        const bytes = await window.api.library.readFile(filePath)
        if (!bytes) return
        const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' })
        objectUrl = URL.createObjectURL(blob)
        setResolvedUrl(objectUrl)
      } catch (err) { console.error(err) }
    })
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [currentTrack?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !resolvedUrl) return
    audio.src    = resolvedUrl
    audio.volume = volume
    if (isPlaying) audio.play().catch(() => {})
  }, [resolvedUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else           audio.pause()
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const handleEnded = () => {
    const nextId = nextTrack()
    if (nextId) {
      const next = getTrackById(nextId)
      if (next) { setCurrentTrack(next); if (next.mood) setMood(next.mood) }
    } else { setIsPlaying(false) }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const t    = ((e.clientX - rect.left) / rect.width) * duration
    if (audioRef.current) audioRef.current.currentTime = t
    setProgress(t)
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  /*
    Paleta de barras:
    - Progreso (canción): track = morado oscuro #6b2d5e | fill = moodColor vivo
    - Volumen:            track = verde oscuro  #2d6b45 | fill = amarillo/lima #c8f03c
    Así se diferencian visualmente al instante.
  */
  const progressTrack = '#6b2d5e'   // morado oscuro — fondo barra canción
  const volumeTrack   = '#2d4a6b'   // azul pizarra oscuro — fondo barra volumen
  const volumeFill    = '#f9c74f'   // amarillo dorado — fill volumen (diferente al mood)

  return (
    <div style={{
      height: '100%', width: '100%', maxWidth: 420,
      margin: '0 auto', display: 'flex', flexDirection: 'column',
      padding: 8, gap: 8, overflow: 'hidden',
    }}>
      {/* Keyframe de vibración — se inyecta una sola vez */}
      <style>{`
        @keyframes pixelVibrate {
          0%   { transform: translate(0px,  0px); }
          25%  { transform: translate(0px, -1px); }
          50%  { transform: translate(1px,  0px); }
          75%  { transform: translate(0px,  1px); }
          100% { transform: translate(-1px, 0px); }
        }
      `}</style>

      <audio
        ref={audioRef}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0)
          setIsPlaying(true)
          audioRef.current?.play().catch(() => {})
        }}
        onEnded={handleEnded}
      />

      {/* BACK */}
      <button
        className="px-btn"
        style={{ fontSize: 8, alignSelf: 'flex-start', padding: '5px 10px' }}
        onClick={() => navigate('/')}
      >
        ◀ VOLVER
      </button>

      {!currentTrack ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 28, color: 'var(--accent)', animation: 'float 2s infinite' }}>♪</div>
          <div style={{ fontSize: 8, color: 'var(--text2)' }}>SIN CANCIÓN</div>
        </div>
      ) : (
        <>
          {/* PORTADA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 100, height: 100,
              background: 'var(--surface)',
              border: '3px solid var(--border)',
              boxShadow: '4px 4px 0 var(--shadow), inset 0 0 0 1px var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              imageRendering: 'pixelated', overflow: 'hidden',
              animation: isPlaying ? 'float 2s ease-in-out infinite' : 'none',
            }}>
              <CloudSprite asAlbumArt mood={currentMood} />
            </div>

            {/* TÍTULO CON VIBRACIÓN PIXEL */}
            <div style={{
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              boxShadow: '2px 2px 0 var(--shadow)',
              width: '100%', overflow: 'hidden',
              padding: '5px 8px',
            }}>
              <PixelTitle text={trackName} />
            </div>
          </div>

          {/* VISUALIZER */}
          <PixelBars isPlaying={isPlaying} color={moodColor} />

          {/* BARRA DE PROGRESO */}
          <div>
            <div style={{
              height: 8,
              background: progressTrack,         // morado oscuro — siempre visible
              border: '2px solid var(--border)',
              cursor: 'pointer', position: 'relative',
              boxShadow: '2px 2px 0 var(--shadow)',
              imageRendering: 'pixelated',
            }} onClick={handleSeek}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: moodColor,           // color vivo del mood — contrasta con morado
              }} />
              <div style={{
                position: 'absolute', top: '-2px',
                left: `calc(${pct}% - 3px)`,
                width: 6, height: 12,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 6, color: 'var(--text2)' }}>{formatTime(progress)}</span>
              <span style={{ fontSize: 6, color: 'var(--text2)' }}>{formatTime(duration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button
              className="px-btn"
              style={{ fontSize: 10, padding: '8px 12px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const id = prevTrack()
                if (id) { const t = getTrackById(id); if (t) { setCurrentTrack(t); if (t.mood) setMood(t.mood) } }
              }}
            ><IconPrev /></button>

            <button
              className="px-btn px-btn-primary"
              style={{
                padding: '10px 18px',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isPlaying ? 'heartbeat 1s infinite' : 'none',
              }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>

            <button
              className="px-btn"
              style={{ fontSize: 10, padding: '8px 12px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const id = nextTrack()
                if (id) { const t = getTrackById(id); if (t) { setCurrentTrack(t); if (t.mood) setMood(t.mood) } }
              }}
            ><IconNext /></button>
          </div>

          {/* BARRA DE VOLUMEN — colores distintos a la de progreso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>
              <IconVolume level={volume === 0 ? 0 : volume < 0.5 ? 1 : 2} />
            </span>
            <div style={{
              flex: 1, height: 7,
              background: volumeTrack,           // azul pizarra oscuro — diferente al de progreso
              border: '2px solid var(--border)',
              position: 'relative', cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--shadow)',
            }} onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
            }}>
              <div style={{
                height: '100%',
                width: `${volume * 100}%`,
                background: volumeFill,          // amarillo dorado — diferente al moodColor
                imageRendering: 'pixelated',
              }} />
            </div>
          </div>

          {/* COLA */}
          {queue.length > 1 && (
            <div style={{ fontSize: 6, color: 'var(--text2)', textAlign: 'center' }}>
              ♪ {queueIndex + 1} / {queue.length}
            </div>
          )}
        </>
      )}
    </div>
  )
}
