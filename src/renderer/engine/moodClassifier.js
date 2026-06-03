// Umbrales de clasificación por mood
// Basados en audio features de Spotify: energy [0-1], valence [0-1], tempo [BPM]
// Como getAudioFeatures está deprecado, usamos los datos de /recommendations
// y los metadatos del track como proxy.

export const MOOD_CONFIG = {
  gym: {
    label: 'Gym',
    emoji: '🔥',
    color: '#ff4d4d',
    thresholds: { energyMin: 0.75, valenceMin: 0.35, tempoMin: 130 },
    description: 'Energía máxima para entrenar',
    bgFolder: 'gym',
  },
  tension: {
    label: 'Tensión',
    emoji: '⚡',
    color: '#9b5de5',
    thresholds: { energyMin: 0.55, valenceMax: 0.42, tempoMin: 110 },
    description: 'Intensa y oscura',
    bgFolder: 'tension',
  },
  feliz: {
    label: 'Feliz',
    emoji: '☀️',
    color: '#f9c74f',
    thresholds: { energyMin: 0.5, valenceMin: 0.6, tempoMin: 100 },
    description: 'Alegre y con buen rollo',
    bgFolder: 'feliz',
  },
  romantica: {
    label: 'Romántica',
    emoji: '🌹',
    color: '#e8698a',
    thresholds: { energyMin: 0.25, energyMax: 0.68, valenceMin: 0.38, tempoMax: 130 },
    description: 'Suave y emocional',
    bgFolder: 'romantica',
  },
  relajante: {
    label: 'Relajante',
    emoji: '🌿',
    color: '#52b788',
    thresholds: { energyMax: 0.48, valenceMin: 0.3, tempoMax: 115 },
    description: 'Tranquila y serena',
    bgFolder: 'relajante',
  },
  nostalgica: {
    label: 'Nostálgica',
    emoji: '🍂',
    color: '#e07a5f',
    thresholds: { energyMin: 0.2, energyMax: 0.55, valenceMin: 0.2, valenceMax: 0.55 },
    description: 'Entre recuerdos y melancolía',
    bgFolder: 'nostalgica',
  },
  triste: {
    label: 'Triste',
    emoji: '💙',
    color: '#4a90d9',
    thresholds: { energyMax: 0.42, valenceMax: 0.38 },
    description: 'Melancólica y profunda',
    bgFolder: 'triste',
  },
}

// Priority order — first match wins
const MOOD_PRIORITY = ['gym', 'tension', 'feliz', 'romantica', 'relajante', 'nostalgica', 'triste']

/**
 * Clasifica un track según sus audio features.
 * @param {Object} features - { energy, valence, tempo, danceability, acousticness }
 * @returns {string} mood key
 */
export function classifyMood(features) {
  if (!features) return 'relajante'

  const { energy = 0.5, valence = 0.5, tempo = 120 } = features

  for (const mood of MOOD_PRIORITY) {
    const t = MOOD_CONFIG[mood].thresholds
    const checks = [
      t.energyMin  === undefined || energy >= t.energyMin,
      t.energyMax  === undefined || energy <= t.energyMax,
      t.valenceMin === undefined || valence >= t.valenceMin,
      t.valenceMax === undefined || valence <= t.valenceMax,
      t.tempoMin   === undefined || tempo >= t.tempoMin,
      t.tempoMax   === undefined || tempo <= t.tempoMax,
    ]
    if (checks.every(Boolean)) return mood
  }

  return 'relajante' // default fallback
}

/**
 * Estima features desde metadatos del track cuando audio-features no está disponible.
 * Usa popularidad, duración y géneros del artista como proxy.
 */
export function estimateFeaturesFromMetadata(track, artistGenres = []) {
  // Duración: tracks muy cortas tienden a ser energéticas
  const durationMin = (track.duration_ms || 210000) / 60000
  const energyFromDuration = durationMin < 3 ? 0.7 : durationMin > 5 ? 0.4 : 0.55

  // Géneros del artista como señales
  const genreSignals = {
    energy: 0.5,
    valence: 0.5,
    tempo: 120,
  }

  const genreStr = artistGenres.join(' ').toLowerCase()

  if (/metal|hardcore|punk|drill|trap|bass/.test(genreStr)) {
    genreSignals.energy = 0.85; genreSignals.valence = 0.35; genreSignals.tempo = 155
  } else if (/pop|dance|edm|house|funk/.test(genreStr)) {
    genreSignals.energy = 0.72; genreSignals.valence = 0.72; genreSignals.tempo = 128
  } else if (/r&b|soul|neo-soul/.test(genreStr)) {
    genreSignals.energy = 0.48; genreSignals.valence = 0.55; genreSignals.tempo = 95
  } else if (/jazz|classical|ambient|chill/.test(genreStr)) {
    genreSignals.energy = 0.28; genreSignals.valence = 0.45; genreSignals.tempo = 85
  } else if (/sad|emo|indie|alternative/.test(genreStr)) {
    genreSignals.energy = 0.42; genreSignals.valence = 0.32; genreSignals.tempo = 105
  } else if (/latin|reggaeton|cumbia|salsa/.test(genreStr)) {
    genreSignals.energy = 0.78; genreSignals.valence = 0.75; genreSignals.tempo = 135
  }

  return {
    energy: (energyFromDuration + genreSignals.energy) / 2,
    valence: genreSignals.valence,
    tempo: genreSignals.tempo,
  }
}

/**
 * Analiza una lista de tracks y devuelve distribución de moods.
 * @param {Array} tracks - Array de { features } objects
 * @returns {Object} { moodName: count }
 */
export function analyzePlaylistMoods(tracks) {
  const counts = {}
  MOOD_PRIORITY.forEach(m => { counts[m] = 0 })

  tracks.forEach(track => {
    const mood = classifyMood(track.features)
    counts[mood]++
  })

  return counts
}

/**
 * Devuelve el mood dominante de una distribución.
 */
export function getDominantMood(moodCounts) {
  return Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'relajante'
}

export function getMoodConfig(mood) {
  return MOOD_CONFIG[mood] || MOOD_CONFIG.relajante
}
