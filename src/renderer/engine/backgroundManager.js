import { MOOD_CONFIG } from './moodClassifier'

// Importa todos los frames de todas las carpetas en assets/backgrounds/
// Vite resuelve estas rutas en build time — no necesita /public/
const allFrames = import.meta.glob(
  '../assets/backgrounds/**/*.{jpg,jpeg,png,webp}',
  { eager: true, query: '?url', import: 'default' }
)

const frameCache = {}
let currentMood = null
let animationId = null
let currentFrameIndex = 0
let lastFrameTime = 0
const FPS = 12

let isCrossfading = false
let targetMood = null
const CROSSFADE_DURATION = 600

/**
 * Pre-carga los frames de un mood desde assets/backgrounds/{folder}/
 */
export async function preloadMoodFrames(mood) {
  if (frameCache[mood] !== undefined) return frameCache[mood]

  const folder = MOOD_CONFIG[mood]?.bgFolder || mood
  const prefix = `../assets/backgrounds/${folder}/`

  // Filtrar y ordenar los frames de este mood
  const urls = Object.entries(allFrames)
    .filter(([path]) => path.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, url]) => url)

  console.log(`[BG] mood="${mood}" folder="${folder}" urls encontradas:`, urls)

  if (urls.length === 0) {
    console.warn(`[BG] No hay frames para mood="${mood}" en assets/backgrounds/${folder}/`)
    frameCache[mood] = null
    return null
  }

  // Cargar las imágenes
  const frames = await Promise.all(
    urls.map(url => new Promise(resolve => {
      const img = new Image()
      img.onload  = () => { console.log('[BG] cargado:', url); resolve(img) }
      img.onerror = () => { console.warn('[BG] error cargando:', url); resolve(null) }
      img.src = url
    }))
  )

  const valid = frames.filter(Boolean)
  console.log(`[BG] mood="${mood}" frames válidos: ${valid.length}`)
  frameCache[mood] = valid.length > 0 ? valid : null
  return frameCache[mood]
}

export function startBackgroundLoop(canvasA, canvasB, initialMood) {
  currentMood = initialMood
  targetMood  = initialMood
  currentFrameIndex = 0
  isCrossfading = false

  if (animationId) cancelAnimationFrame(animationId)

  function loop(timestamp) {
    animationId = requestAnimationFrame(loop)

    const elapsed = timestamp - lastFrameTime
    const frameDuration = 1000 / FPS

    const frames = frameCache[currentMood]
    if (frames && frames.length > 0) {
      const ctx = canvasA.getContext('2d')
      ctx.clearRect(0, 0, canvasA.width, canvasA.height)
      ctx.drawImage(frames[currentFrameIndex % frames.length], 0, 0, canvasA.width, canvasA.height)
    }

    if (isCrossfading && targetMood && targetMood !== currentMood) {
      const tFrames = frameCache[targetMood]
      if (tFrames && tFrames.length > 0) {
        const ctxB = canvasB.getContext('2d')
        ctxB.clearRect(0, 0, canvasB.width, canvasB.height)
        ctxB.drawImage(tFrames[currentFrameIndex % tFrames.length], 0, 0, canvasB.width, canvasB.height)
      }
    }

    if (elapsed >= frameDuration) {
      currentFrameIndex++
      lastFrameTime = timestamp
    }
  }

  animationId = requestAnimationFrame(loop)
}

export async function transitionToMood(newMood, canvasA, canvasB, onComplete) {
  if (newMood === currentMood) return
  await preloadMoodFrames(newMood)

  targetMood    = newMood
  isCrossfading = true

  canvasB.style.opacity    = '0'
  canvasB.style.transition = `opacity ${CROSSFADE_DURATION}ms ease`

  requestAnimationFrame(() => { canvasB.style.opacity = '1' })

  setTimeout(() => {
    currentMood              = newMood
    canvasA.style.opacity    = '1'
    canvasB.style.opacity    = '0'
    canvasB.style.transition = 'none'
    isCrossfading            = false
    currentFrameIndex        = 0
    if (onComplete) onComplete(newMood)
  }, CROSSFADE_DURATION)
}

export function stopBackgroundLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}
