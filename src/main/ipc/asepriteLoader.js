const fs   = require('fs')
const path = require('path')
const Aseprite = require('../lib/Aseprite')

// Mapeo mood → nombre de layer en el .aseprite
const MOOD_LAYER_MAP = {
  romantica:  'Layer romantico',
  gym:        'Layer Gym',
  triste:     'Layer Triste',
  // moods sin layer propia → fallback a romantica
  feliz:      'Layer romantico',
  relajante:  'Layer romantico',
  nostalgica: 'Layer Triste',
  tension:    'Layer Gym',
  default:    'Layer romantico',
}

/**
 * Renderiza los frames de UNA sola layer del .aseprite.
 * Solo renderiza los frames que tienen cel en esa layer.
 */
function renderLayerFrames(ase, layerName) {
  const { width, height } = ase

  // Encontrar índice de la layer por nombre (case-insensitive por si acaso)
  const layerIndex = ase.layers.findIndex(
    l => l.name.toLowerCase() === layerName.toLowerCase()
  )
  if (layerIndex === -1) {
    console.warn(`[asepriteLoader] Layer "${layerName}" no encontrada. Layers disponibles:`, ase.layers.map(l => l.name))
    return null
  }

  const results = []

  for (const frame of ase.frames) {
    // Buscar el cel de esta layer en este frame
    const cel = frame.cels.find(c => c.layerIndex === layerIndex && c.rawCelData)
    if (!cel) continue  // este frame no tiene cel para esta layer → skip

    const rgba = new Uint8ClampedArray(width * height * 4)
    const celOpacity   = cel.opacity / 255
    const layer        = ase.layers[layerIndex]
    const layerOpacity = layer ? (layer.opacity / 255) : 1
    const opacity      = celOpacity * layerOpacity

    const celW = cel.w
    const celH = cel.h
    const raw  = cel.rawCelData
    const { colorDepth, palette, paletteIndex } = ase

    for (let row = 0; row < celH; row++) {
      for (let col = 0; col < celW; col++) {
        const destX = cel.xpos + col
        const destY = cel.ypos + row
        if (destX < 0 || destX >= width || destY < 0 || destY >= height) continue

        let r, g, b, a

        if (colorDepth === 32) {
          const srcIdx = (row * celW + col) * 4
          r = raw[srcIdx]; g = raw[srcIdx + 1]; b = raw[srcIdx + 2]; a = raw[srcIdx + 3]
        } else if (colorDepth === 16) {
          const srcIdx = (row * celW + col) * 2
          r = g = b = raw[srcIdx]; a = raw[srcIdx + 1]
        } else if (colorDepth === 8) {
          const srcIdx = row * celW + col
          const palIdx = raw[srcIdx]
          if (palIdx === paletteIndex) { a = 0 }
          else if (palette?.colors[palIdx]) {
            const c = palette.colors[palIdx]
            r = c.red; g = c.green; b = c.blue; a = c.alpha
          } else continue
        } else continue

        if (a === 0) continue

        const dstIdx = (destY * width + destX) * 4
        const srcA = (a / 255) * opacity
        const dstA = rgba[dstIdx + 3] / 255

        if (dstA === 0) {
          rgba[dstIdx] = r; rgba[dstIdx+1] = g; rgba[dstIdx+2] = b
          rgba[dstIdx+3] = Math.round(srcA * 255)
        } else {
          const outA = srcA + dstA * (1 - srcA)
          rgba[dstIdx]   = Math.round((r * srcA + rgba[dstIdx]   * dstA * (1-srcA)) / outA)
          rgba[dstIdx+1] = Math.round((g * srcA + rgba[dstIdx+1] * dstA * (1-srcA)) / outA)
          rgba[dstIdx+2] = Math.round((b * srcA + rgba[dstIdx+2] * dstA * (1-srcA)) / outA)
          rgba[dstIdx+3] = Math.round(outA * 255)
        }
      }
    }

    results.push({
      width, height,
      duration: frame.frameDuration,
      rgba: Array.from(rgba),
    })
  }

  return results.length > 0 ? results : null
}

/**
 * Carga el .aseprite y devuelve los frames de la layer correspondiente al mood.
 */
function loadAsepriteByMood(filePath, mood) {
  const buf = fs.readFileSync(filePath)
  const ase = new Aseprite(buf, path.basename(filePath))
  ase.parse()

  const layerName = MOOD_LAYER_MAP[mood] || MOOD_LAYER_MAP.default
  const frames    = renderLayerFrames(ase, layerName)

  if (!frames) {
    // Fallback: devolver todos los frames visibles (comportamiento original)
    return loadAsepriteFrames_legacy(ase)
  }

  return { width: ase.width, height: ase.height, numFrames: frames.length, frames, mood, layerName }
}

/**
 * Carga todos los frames (comportamiento legacy — por compatibilidad).
 */
function loadAsepriteFrames(filePath) {
  const buf = fs.readFileSync(filePath)
  const ase = new Aseprite(buf, path.basename(filePath))
  ase.parse()
  return loadAsepriteFrames_legacy(ase)
}

function loadAsepriteFrames_legacy(ase) {
  const { width, height, colorDepth, palette, paletteIndex } = ase
  const results = []

  for (const frame of ase.frames) {
    const rgba = new Uint8ClampedArray(width * height * 4)
    const cels = [...frame.cels].sort((a, b) => a.layerIndex - b.layerIndex)

    for (const cel of cels) {
      if (!cel.rawCelData) continue
      const layer = ase.layers[cel.layerIndex]
      if (layer) {
        const f = layer.flags
        const visible = (f && typeof f === 'object') ? (f.visible !== false) : Boolean(f & 1)
        if (!visible) continue
      }
      const celOpacity   = (cel.opacity / 255)
      const layerOpacity = layer ? (layer.opacity / 255) : 1
      const opacity      = celOpacity * layerOpacity
      const celW = cel.w, celH = cel.h, raw = cel.rawCelData

      for (let row = 0; row < celH; row++) {
        for (let col = 0; col < celW; col++) {
          const destX = cel.xpos + col, destY = cel.ypos + row
          if (destX < 0 || destX >= width || destY < 0 || destY >= height) continue
          let r, g, b, a
          if (colorDepth === 32) {
            const i = (row * celW + col) * 4
            r = raw[i]; g = raw[i+1]; b = raw[i+2]; a = raw[i+3]
          } else if (colorDepth === 16) {
            const i = (row * celW + col) * 2
            r = g = b = raw[i]; a = raw[i+1]
          } else if (colorDepth === 8) {
            const i = row * celW + col, palIdx = raw[i]
            if (palIdx === paletteIndex) { a = 0 }
            else if (palette?.colors[palIdx]) { const c = palette.colors[palIdx]; r=c.red;g=c.green;b=c.blue;a=c.alpha }
            else continue
          } else continue
          if (a === 0) continue
          const dstIdx = (destY * width + destX) * 4
          const srcA = (a/255)*opacity, dstA = rgba[dstIdx+3]/255
          if (dstA === 0) { rgba[dstIdx]=r;rgba[dstIdx+1]=g;rgba[dstIdx+2]=b;rgba[dstIdx+3]=Math.round(srcA*255) }
          else {
            const outA = srcA + dstA*(1-srcA)
            rgba[dstIdx]  =Math.round((r*srcA+rgba[dstIdx]  *dstA*(1-srcA))/outA)
            rgba[dstIdx+1]=Math.round((g*srcA+rgba[dstIdx+1]*dstA*(1-srcA))/outA)
            rgba[dstIdx+2]=Math.round((b*srcA+rgba[dstIdx+2]*dstA*(1-srcA))/outA)
            rgba[dstIdx+3]=Math.round(outA*255)
          }
        }
      }
    }
    results.push({ width, height, duration: frame.frameDuration, rgba: Array.from(rgba) })
  }
  return { width, height, numFrames: results.length, frames: results, tags: ase.tags }
}

module.exports = { loadAsepriteFrames, loadAsepriteByMood, MOOD_LAYER_MAP }
