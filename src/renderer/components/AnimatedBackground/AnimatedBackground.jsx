import React, { useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { preloadMoodFrames, startBackgroundLoop, transitionToMood, stopBackgroundLoop } from '../../engine/backgroundManager'
import CloudSprite from '../CloudSprite/CloudSprite'
import styles from './AnimatedBackground.module.css'

export default function AnimatedBackground({ mood }) {
  const canvasARef  = useRef(null)
  const canvasBRef  = useRef(null)
  const prevMoodRef = useRef(null)
  const startedRef  = useRef(false)
  const location    = useLocation()

  // 'center' en biblioteca (/), 'top' en reproductor (/player)
  const spritePosition = location.pathname === '/player' ? 'top' : 'center'

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const canvasA = canvasARef.current
    const canvasB = canvasBRef.current
    if (!canvasA || !canvasB) return

    canvasA.width  = window.innerWidth
    canvasA.height = window.innerHeight
    canvasB.width  = window.innerWidth
    canvasB.height = window.innerHeight

    const handleResize = () => {
      canvasA.width  = window.innerWidth
      canvasA.height = window.innerHeight
      canvasB.width  = window.innerWidth
      canvasB.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const initialMood = mood || 'romantica'
    preloadMoodFrames(initialMood).then(() => {
      startBackgroundLoop(canvasA, canvasB, initialMood)
      prevMoodRef.current = initialMood
      canvasA.style.opacity    = '1'
      canvasA.style.transition = 'opacity 0.8s ease'
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      stopBackgroundLoop()
      startedRef.current = false
    }
  }, [])

  useEffect(() => {
    const canvasA = canvasARef.current
    const canvasB = canvasBRef.current
    if (!canvasA || !canvasB) return
    if (!mood || mood === prevMoodRef.current) return
    transitionToMood(mood, canvasA, canvasB, (newMood) => {
      prevMoodRef.current = newMood
    })
  }, [mood])

  return (
    <div className={styles.container}>
      <canvas ref={canvasARef} className={styles.canvas} style={{ opacity: 0 }} />
      <canvas ref={canvasBRef} className={styles.canvas} style={{ opacity: 0, zIndex: 1 }} />
      <div className={styles.overlay} />
      <CloudSprite mood={mood} position={spritePosition} />
    </div>
  )
}
