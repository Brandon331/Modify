import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibraryStore } from '../../store/libraryStore'
import { usePlayerStore } from '../../store/playerStore'
import { useMoodStore } from '../../store/moodStore'

const MOOD_COLORS = {
  feliz:     '#f9c74f',
  romantica: '#e8698a',
  relajante: '#52b788',
  triste:    '#4a90d9',
  tension:   '#9b5de5',
  gym:       '#ff4d4d',
  nostalgica:'#e07a5f',
}

function PixelTag({ mood, moods }) {
  const m = moods.find(x => x.id === mood)
  if (!m) return null
  return (
    <span style={{
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      background: MOOD_COLORS[mood] || 'var(--accent2)',
      color: '#fff',
      border: '1px solid var(--border)',
      padding: '3px 7px',
      boxShadow: '1px 1px 0 var(--shadow)',
      whiteSpace: 'nowrap',
    }}>
      {m.emoji} {m.label}
    </span>
  )
}

export default function Library({ moods }) {
  const navigate = useNavigate()
  const tracks      = useLibraryStore(s => s.tracks)
  const importFiles = useLibraryStore(s => s.importFiles)
  const deleteTrack = useLibraryStore(s => s.deleteTrack)
  const saveMood    = useLibraryStore(s => s.saveMood)
  const setCurrentTrack = usePlayerStore(s => s.setCurrentTrack)
  const setQueue        = usePlayerStore(s => s.setQueue)
  const setMood         = useMoodStore(s => s.setMood)

  const [moodPicker, setMoodPicker]   = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const handleImport = () => importFiles()

  const handleSetMood = async (trackId, moodId) => {
    await saveMood(trackId, moodId, {})
    setMoodPicker(null)
  }

  const handlePlay = (track) => {
    const ids = tracks.map(t => t.id)
    const idx = ids.indexOf(track.id)
    setQueue(ids, idx)
    setCurrentTrack(track)
    if (track.mood) setMood(track.mood)
    navigate('/player')
  }

  const openPicker = (trackId, btnEl) => {
    if (moodPicker === trackId) { setMoodPicker(null); return }
    const rect = btnEl.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMoodPicker(trackId)
  }

  useEffect(() => {
    if (!moodPicker) return
    const close = () => setMoodPicker(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [moodPicker])

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '14px 12px',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: 4, letterSpacing: 1 }}>
            ♪ BIBLIOTECA
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text2)' }}>
            {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
          </div>
        </div>
        <button className="px-btn px-btn-primary"
          onClick={handleImport}
          style={{ fontSize: '8px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          + AGREGAR
        </button>
      </div>

      {/* ── Lista ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {tracks.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            paddingBottom: 40,
          }}>
            <div style={{ fontSize: '11px', color: 'var(--accent)', animation: 'float 2s infinite' }}>♪</div>
            <div style={{ fontSize: '9px', color: 'var(--text2)', textAlign: 'center', lineHeight: 2.2 }}>
              SIN CANCIONES<br />
              <span style={{ color: 'var(--accent)' }}>AGREGA TUS MP3s</span>
            </div>
            <button className="px-btn px-btn-primary" onClick={handleImport}
              style={{ fontSize: '8px', padding: '8px 14px', marginTop: 6 }}>
              ♪ ABRIR ARCHIVOS
            </button>
          </div>
        ) : tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            moods={moods}
            moodPicker={moodPicker}
            onOpenPicker={openPicker}
            onPlay={handlePlay}
            onDelete={deleteTrack}
            onSetMood={handleSetMood}
          />
        ))}
      </div>

      {/* ── Dropdown mood picker ── */}
      {moodPicker && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            right: dropdownPos.right,
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            boxShadow: '4px 4px 0 var(--shadow)',
            zIndex: 9999,
            minWidth: 180,
          }}
        >
          <div style={{
            fontSize: '7px', color: 'var(--text2)',
            fontFamily: "'Press Start 2P', monospace",
            padding: '7px 10px',
            borderBottom: '1px solid var(--border2)',
            letterSpacing: 0.3,
          }}>
            ASIGNAR MOOD
          </div>
          {moods.map(m => {
            const track = tracks.find(t => t.id === moodPicker)
            const isActive = track?.mood === m.id
            return (
              <button key={m.id}
                onClick={() => handleSetMood(moodPicker, m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 12px', fontSize: '7px',
                  fontFamily: "'Press Start 2P', monospace",
                  background: isActive ? (MOOD_COLORS[m.id] + '33') : 'transparent',
                  color: isActive ? MOOD_COLORS[m.id] : 'var(--text)',
                  border: 'none',
                  borderBottom: '1px solid var(--border2)',
                  borderLeft: isActive ? `3px solid ${MOOD_COLORS[m.id]}` : '3px solid transparent',
                  cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
                }}>
                <span style={{ fontSize: '12px' }}>{m.emoji}</span>
                {m.label}
                {isActive && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TrackRow({ track, moods, moodPicker, onOpenPicker, onPlay, onDelete, onSetMood }) {
  const btnRef = useRef(null)
  // Más caracteres visibles ahora que los elementos son más grandes
  const name = track.name.length > 28 ? track.name.slice(0, 28) + '…' : track.name
  const isOpen = moodPicker === track.id

  return (
    <div style={{
      background: 'var(--surface)',
      border: `2px solid ${isOpen ? 'var(--accent)' : 'var(--border2)'}`,
      boxShadow: '2px 2px 0 var(--shadow)',
      padding: '9px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
      position: 'relative',
      flexShrink: 0,
      transition: 'border-color 0.1s',
    }}>
      {/* Play */}
      <button className="px-btn"
        style={{ padding: '5px 9px', fontSize: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => onPlay(track)}>
        <svg width="10" height="12" viewBox="0 0 10 12" xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', fill: 'currentColor', imageRendering: 'pixelated' }}>
          <polygon points="0,0 0,12 10,6" />
        </svg>
      </button>

      {/* Nombre + mood tag */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '8px', color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: track.mood ? 5 : 0 }}>
          {name}
        </div>
        {track.mood && <PixelTag mood={track.mood} moods={moods} />}
      </div>

      {/* Botón mood picker */}
      <button
        ref={btnRef}
        className="px-btn"
        style={{
          fontSize: '9px', padding: '4px 8px', flexShrink: 0,
          background: isOpen ? 'var(--accent2)' : undefined,
          color: isOpen ? 'var(--surface)' : 'var(--text)',
        }}
        onClick={(e) => { e.stopPropagation(); onOpenPicker(track.id, btnRef.current) }}>
        {track.mood ? '✦' : '♡'}
      </button>

      {/* Borrar */}
      <button className="px-btn"
        style={{ fontSize: '9px', padding: '4px 8px', flexShrink: 0, color: 'var(--accent)' }}
        onClick={() => onDelete(track.id)}>
        ✕
      </button>
    </div>
  )
}
