/**
 * mp3Analyzer.js  — análisis en el main process (Node.js, sin AudioContext)
 *
 * Lee los primeros ~500 KB del MP3 y extrae:
 *   • energía aproximada via amplitud de frames MPEG
 *   • tempo estimado via detección de onsets en la amplitud
 *   • valence estimada (energy + tempo)
 *   • zcr aproximado
 *
 * Sin dependencias externas. Funciona con MP3 MPEG-1 Layer III (CBR/VBR).
 */

'use strict'
const fs = require('fs')

// ─── Leer cabecera de frame MPEG ───────────────────────────────────────────────
// Devuelve { frameSize, bitrate, sampleRate } o null si no es frame válido
function parseMpegHeader(buf, offset) {
  if (offset + 4 > buf.length) return null
  const b0 = buf[offset], b1 = buf[offset+1], b2 = buf[offset+2]

  // Sync word: 11 bits a 1
  if (b0 !== 0xFF || (b1 & 0xE0) !== 0xE0) return null

  const version = (b1 >> 3) & 0x3   // 0=2.5, 2=2, 3=1
  const layer   = (b1 >> 1) & 0x3   // 1=III, 2=II, 3=I
  if (layer !== 1) return null       // solo Layer III (MP3)

  const bitrateIdx  = (b2 >> 4) & 0xF
  const srateIdx    = (b2 >> 2) & 0x3
  const padding     = (b2 >> 1) & 0x1

  const bitrateTable = {
    3: [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],  // v1 L3
    2: [0, 8,16,24,32,40,48,56, 64, 80, 96,112,128,144,160,0],  // v2 L3
  }
  const srateTable = {
    3: [44100,48000,32000],
    2: [22050,24000,16000],
    0: [11025,12000, 8000],
  }

  const v = version === 3 ? 3 : 2
  const bitrate = (bitrateTable[v] || bitrateTable[2])[bitrateIdx]
  if (!bitrate) return null

  const srArr = srateTable[version] || srateTable[2]
  const sampleRate = srArr[srateIdx]
  if (!sampleRate) return null

  // Tamaño de frame MPEG-1: 144 * bitrate * 1000 / sampleRate + padding
  const frameSize = Math.floor(144 * bitrate * 1000 / sampleRate) + padding

  return { frameSize, bitrate, sampleRate }
}

// ─── Saltar ID3v2 si existe ────────────────────────────────────────────────────
function skipID3v2(buf) {
  if (buf.length < 10) return 0
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    // ID3v2 header: 'ID3' + version(2) + flags(1) + size(4, syncsafe)
    const size = ((buf[6] & 0x7F) << 21) | ((buf[7] & 0x7F) << 14) |
                 ((buf[8] & 0x7F) << 7)  |  (buf[9] & 0x7F)
    return 10 + size
  }
  return 0
}

// ─── Análisis principal ────────────────────────────────────────────────────────
function analyzeMp3Buffer(buf) {
  let offset = skipID3v2(buf)

  // Acumular amplitud media por frame
  const frameAmps = []
  let sampleRate = 44100
  let totalFrames = 0

  const MAX_BYTES = Math.min(buf.length, 600_000) // analizar máx ~600 KB

  while (offset < MAX_BYTES) {
    const hdr = parseMpegHeader(buf, offset)
    if (!hdr || hdr.frameSize < 4) {
      offset++
      continue
    }
    sampleRate = hdr.sampleRate

    // Amplitud aproximada: promedio de bytes del payload del frame
    // (no es PCM real, pero es proporcional a la energía)
    const end = Math.min(offset + hdr.frameSize, buf.length)
    let sum = 0
    for (let i = offset + 4; i < end; i++) {
      const v = buf[i] - 128  // centrar en 0
      sum += v * v
    }
    const rms = Math.sqrt(sum / (end - offset - 4))
    frameAmps.push(rms)

    offset += hdr.frameSize
    totalFrames++
    if (totalFrames > 4000) break  // límite seguro
  }

  if (frameAmps.length < 4) {
    // No se pudo parsear → valores por defecto razonables
    return { energy: 0.5, tempo: 120, valence: 0.5, zcr: 0.05 }
  }

  // ── Energy (RMS normalizada) ──────────────────────────────────────
  const maxAmp = Math.max(...frameAmps) || 1
  const meanAmp = frameAmps.reduce((a,b) => a+b, 0) / frameAmps.length
  const energy = Math.min(meanAmp / maxAmp * 2.5, 1)

  // ── Tempo via detección de onsets en la envolvente ────────────────
  // Suavizar envolvente
  const smoothed = frameAmps.map((v, i) => {
    const sl = frameAmps.slice(Math.max(0, i-2), i+3)
    return sl.reduce((a,b) => a+b, 0) / sl.length
  })
  const mean = smoothed.reduce((a,b) => a+b, 0) / smoothed.length
  const peaks = []
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] > smoothed[i-1] && smoothed[i] > smoothed[i+1] &&
        smoothed[i] > mean * 1.5) {
      peaks.push(i)
    }
  }

  // Cada frame MPEG-1 Layer III tiene 1152 muestras
  const samplesPerFrame = 1152
  let tempo = 120
  if (peaks.length >= 2) {
    const ivs = []
    for (let i = 1; i < peaks.length; i++) {
      const sec = ((peaks[i] - peaks[i-1]) * samplesPerFrame) / sampleRate
      if (sec > 0.25 && sec < 2.5) ivs.push(sec)
    }
    if (ivs.length) {
      let bpm = 60 / (ivs.reduce((a,b) => a+b, 0) / ivs.length)
      if (bpm < 60) bpm *= 2
      if (bpm > 200) bpm /= 2
      tempo = Math.round(bpm)
    }
  }

  // ── Valence estimada ──────────────────────────────────────────────
  const normalizedTempo = Math.max(0, Math.min(1, (tempo - 60) / 140))
  const valence = parseFloat((energy * 0.6 + normalizedTempo * 0.4).toFixed(3))

  // ── ZCR aproximado (variaciones en signo de la envolvente) ────────
  let zcr = 0
  for (let i = 1; i < Math.min(frameAmps.length, 500); i++) {
    if ((frameAmps[i] >= mean) !== (frameAmps[i-1] >= mean)) zcr++
  }
  const zcrNorm = parseFloat((zcr / Math.min(frameAmps.length, 500)).toFixed(4))

  return { energy: parseFloat(energy.toFixed(3)), tempo, valence, zcr: zcrNorm }
}

// ─── Handler IPC ──────────────────────────────────────────────────────────────
function analyzeMp3File(filePath) {
  if (!filePath || !require('fs').existsSync(filePath)) {
    return { error: 'Archivo no encontrado: ' + filePath }
  }
  try {
    // Leer solo los primeros 600 KB — suficiente para análisis
    const fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(600_000)
    const bytesRead = fs.readSync(fd, buf, 0, 600_000, 0)
    fs.closeSync(fd)

    return analyzeMp3Buffer(buf.slice(0, bytesRead))
  } catch (err) {
    return { error: err.message }
  }
}

module.exports = { analyzeMp3File }
