import React, { useEffect, useRef, useState, useCallback } from 'react'
import styles from './CloudSprite.module.css'

const SPRITE_REL_PATH = 'src/renderer/assets/sprites/Sprite-0001.aseprite'

// Cache de frames por mood para no recargar el mismo sprite dos veces
const framesCache = {}

export default function CloudSprite({ asAlbumArt = false, mood, position = 'top' }) {
  const canvasRef  = useRef(null)
  const frameRef   = useRef(0)
  const timerRef   = useRef(null)
  const framesRef  = useRef([])

  const [status,     setStatus]     = useState('loading')
  const [hearts,     setHearts]     = useState([])
  const [burst,      setBurst]      = useState(false)

  const startLoopRef = useRef(null)

  // ── Loop de animación ──────────────────────────────────────────────
  const startLoop = useCallback((canvas, frames) => {
    clearTimeout(timerRef.current)
    if (!canvas || !frames?.length) return
    frameRef.current = 0
    const ctx = canvas.getContext('2d')

    const tick = () => {
      const f = frames[frameRef.current]
      if (!f) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.putImageData(f.imageData, 0, 0)
      frameRef.current = (frameRef.current + 1) % frames.length
      timerRef.current = setTimeout(tick, f.duration)
    }
    timerRef.current = setTimeout(tick, frames[0]?.duration || 120)
  }, [])

  // Guardar ref a startLoop para usarlo en el canvasCallbackRef
  useEffect(() => { startLoopRef.current = startLoop }, [startLoop])

  // Cuando el canvas se monta (asAlbumArt monta tarde — después del IPC),
  // si ya hay frames cacheados los aplicamos directo al canvas recién montado.
  const canvasCallbackRef = useCallback((node) => {
    canvasRef.current = node
    if (!node || !framesRef.current?.length) return
    const frames = framesRef.current
    node.width  = frames[0].imageData.width
    node.height = frames[0].imageData.height
    setStatus('ok')
    if (startLoopRef.current) startLoopRef.current(node, frames)
  }, [])

  // ── Carga frames para un mood concreto ────────────────────────────
  const loadMood = useCallback(async (targetMood) => {
    const cacheKey = targetMood || 'default'

    // Si ya tenemos los frames en caché, aplicar directo
    if (framesCache[cacheKey]) {
      const frames = framesCache[cacheKey]
      framesRef.current = frames
      // Marcar ok siempre — si canvas es null (asAlbumArt monta tarde),
      // canvasCallbackRef lo arranca cuando el DOM lo monta
      setStatus('ok')
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width  = frames[0].imageData.width
        canvas.height = frames[0].imageData.height
        startLoop(canvas, frames)
      }
      return
    }

    if (!window.api?.sprite?.loadByMood) {
      setStatus('fallback')
      return
    }

    try {
      const result = await window.api.sprite.loadByMood(SPRITE_REL_PATH, targetMood)
      if (!result?.ok || !result.frames?.length) {
        setStatus('fallback')
        return
      }

      // Convertir a ImageData y cachear
      const frames = result.frames.map(f => ({
        imageData: new ImageData(new Uint8ClampedArray(f.rgba), f.width, f.height),
        duration:  f.duration || 120,
      }))
      framesCache[cacheKey] = frames
      framesRef.current = frames

      const canvas = canvasRef.current
      if (canvas) {
        canvas.width  = result.width
        canvas.height = result.height
        setStatus('ok')
        startLoop(canvas, frames)
      }
    } catch (e) {
      console.error('[CloudSprite] error cargando mood', targetMood, e)
      setStatus('fallback')
    }
  }, [startLoop])

  // ── Carga inicial ──────────────────────────────────────────────────
  useEffect(() => {
    loadMood(mood || 'romantica')
    return () => clearTimeout(timerRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cambio de mood → recargar sprite ────────────
  useEffect(() => {
    if (!mood) return
    clearTimeout(timerRef.current)
    loadMood(mood)
  }, [mood, loadMood])

  // ── Interacción: corazones al click ───────────────────────────────
  const handleClick = useCallback(() => {
    setBurst(true)
    setTimeout(() => setBurst(false), 300)
    const newHearts = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: 15 + Math.random() * 70,
      char: Math.random() < 0.6 ? '♥' : '✦',
      delay: i * 0.11,
    }))
    setHearts(h => [...h, ...newHearts])
    setTimeout(() => setHearts(h => h.filter(hh => !newHearts.find(n => n.id === hh.id))), 2200)
  }, [])

  const canvasStyle = { imageRendering: 'pixelated' }

  // ── MODO PORTADA DE ÁLBUM ─────────────────────────────────────────
  if (asAlbumArt) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        imageRendering: 'pixelated',
      }}>
        <canvas
          ref={canvasCallbackRef}
          style={{ ...canvasStyle, width: '78px', height: 'auto', display: status === 'ok' ? 'block' : 'none' }}
        />
        {status !== 'ok' && <TulipSVG size={70} />}
      </div>
    )
  }

  // ── MODO CENTER (biblioteca) ──────────────────────────────────────
  if (position === 'center') {
    return (
      <div className={`${styles.wrapper} ${styles.wrapperCenter}`}>
        <button
          className={`${styles.cloud} ${styles.cloudMain} ${burst ? styles.burst : ''}`}
          onClick={handleClick}
          aria-label="nube"
        >
          <canvas
            ref={canvasRef}
            className={styles.spriteCanvasCenter}
            style={{ ...canvasStyle, display: status === 'ok' ? 'block' : 'none' }}
          />
          {status !== 'ok' && <CloudSVG width={140} height={84} fill="#f8e8f8" />}
        </button>
        {hearts.map(h => (
          <div key={h.id} className={styles.heart}
            style={{ left: `${h.x}%`, animationDelay: `${h.delay}s` }}>
            {h.char}
          </div>
        ))}
      </div>
    )
  }

  // ── MODO TOP (reproductor) ────────────────────────────────────────
  return (
    <div className={`${styles.wrapper} ${styles.wrapperTop}`}>
      <button
        className={`${styles.cloud} ${styles.cloudMain} ${burst ? styles.burst : ''}`}
        onClick={handleClick}
        aria-label="nube"
      >
        <canvas
          ref={canvasRef}
          className={styles.spriteCanvas}
          style={{ ...canvasStyle, display: status === 'ok' ? 'block' : 'none' }}
        />
        {status !== 'ok' && <CloudSVG width={80} height={48} fill="#f8e8f8" />}
      </button>

      <div className={`${styles.cloud} ${styles.cloudSm}`}>
        <CloudSVG width={52} height={32} fill="#fff0fc" />
      </div>
      <div className={`${styles.cloud} ${styles.cloudXs}`}>
        <CloudSVG width={34} height={22} fill="#fce8f8" />
      </div>

      {hearts.map(h => (
        <div key={h.id} className={styles.heart}
          style={{ left: `${h.x}%`, animationDelay: `${h.delay}s` }}>
          {h.char}
        </div>
      ))}
    </div>
  )
}

function CloudSVG({ width, height, fill }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="14" y="30" width="52" height="14" fill={fill} />
      <rect x="6"  y="24" width="68" height="8"  fill={fill} />
      <rect x="10" y="18" width="46" height="10" fill={fill} />
      <rect x="18" y="10" width="30" height="10" fill={fill} />
      <rect x="26" y="5"  width="20" height="8"  fill={fill} />
      <rect x="14" y="40" width="52" height="4"  fill="#d8b8e8" opacity="0.4" />
      <rect x="26" y="7"  width="8"  height="4"  fill="#fff8ff" opacity="0.8" />
    </svg>
  )
}

function TulipSVG({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 68 68"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect x="32" y="38" width="4"  height="20" fill="#4caf50" />
      <rect x="28" y="48" width="8"  height="4"  fill="#4caf50" />
      <rect x="20" y="44" width="12" height="4"  fill="#66bb6a" />
      <rect x="18" y="42" width="4"  height="4"  fill="#66bb6a" />
      <rect x="26" y="20" width="16" height="20" fill="#e91e8c" />
      <rect x="22" y="24" width="8"  height="14" fill="#f06292" />
      <rect x="38" y="24" width="8"  height="14" fill="#f06292" />
      <rect x="28" y="14" width="12" height="10" fill="#e91e8c" />
      <rect x="30" y="10" width="8"  height="6"  fill="#f48fb1" />
      <rect x="30" y="16" width="4"  height="6"  fill="#f48fb1" opacity="0.7" />
      <rect x="32" y="14" width="2"  height="4"  fill="#ffffff" opacity="0.5" />
    </svg>
  )
}
