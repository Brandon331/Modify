import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../../store/libraryStore'
import { useMoodStore } from '../../store/moodStore'
import { getMoodConfig, MOOD_CONFIG } from '../../engine/moodClassifier'
import styles from './Stats.module.css'

export default function Stats() {
  const tracks = useLibraryStore(s => s.tracks)
  const moodHistory = useMoodStore(s => s.moodHistory)

  // Stats from the analyzed library
  const libraryMoodStats = useMemo(() => {
    const counts = {}
    tracks.filter(t => t.mood).forEach(t => {
      counts[t.mood] = (counts[t.mood] || 0) + 1
    })
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([mood, count]) => ({
        mood, count,
        pct: Math.round((count / total) * 100),
        cfg: getMoodConfig(mood),
      }))
  }, [tracks])

  // Stats from session playback history
  const sessionMoodStats = useMemo(() => {
    const counts = {}
    moodHistory.forEach(({ mood }) => {
      counts[mood] = (counts[mood] || 0) + 1
    })
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([mood, count]) => ({
        mood, count,
        pct: Math.round((count / total) * 100),
        cfg: getMoodConfig(mood),
      }))
  }, [moodHistory])

  const analyzedCount = tracks.filter(t => t.mood).length
  const topLibraryMood = libraryMoodStats[0]
  const topSessionMood = sessionMoodStats[0]

  // Feature averages across analyzed tracks
  const featureAverages = useMemo(() => {
    const analyzed = tracks.filter(t => t.features)
    if (!analyzed.length) return null
    const avg = (key) =>
      analyzed.reduce((sum, t) => sum + (t.features[key] || 0), 0) / analyzed.length
    return {
      energy: avg('energy'),
      valence: avg('valence'),
      tempo: avg('tempo'),
    }
  }, [tracks])

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Estadísticas</h2>
        <div className={styles.headerMeta}>
          {analyzedCount} de {tracks.length} canciones analizadas
        </div>
      </div>

      {/* Top mood summary */}
      {topLibraryMood && (
        <motion.div
          className={styles.moodSummary}
          style={{ '--mood-color': topLibraryMood.cfg.color }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.moodSummaryEmoji}>{topLibraryMood.cfg.emoji}</div>
          <div>
            <div className={styles.moodSummaryLabel}>Mood dominante en tu biblioteca</div>
            <div className={styles.moodSummaryName}>{topLibraryMood.cfg.label}</div>
            <div className={styles.moodSummaryDesc}>
              {topLibraryMood.count} canciones ({topLibraryMood.pct}%) · {topLibraryMood.cfg.description}
            </div>
          </div>
        </motion.div>
      )}

      <div className={styles.columns}>
        {/* Library mood distribution */}
        {libraryMoodStats.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Distribución en biblioteca</h3>
            <div className={styles.moodBars}>
              {libraryMoodStats.map(({ mood, count, pct, cfg }, i) => (
                <motion.div
                  key={mood}
                  className={styles.moodBarRow}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className={styles.moodBarEmoji}>{cfg.emoji}</span>
                  <span className={styles.moodBarName}>{cfg.label}</span>
                  <div className={styles.moodBarTrack}>
                    <motion.div
                      className={styles.moodBarFill}
                      style={{ '--mood-color': cfg.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.06 + 0.1 }}
                    />
                  </div>
                  <span className={styles.moodBarPct}>{count} · {pct}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Session playback history */}
        {sessionMoodStats.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Moods reproducidos (sesión)</h3>
            <div className={styles.moodBars}>
              {sessionMoodStats.map(({ mood, pct, cfg }, i) => (
                <motion.div
                  key={mood}
                  className={styles.moodBarRow}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className={styles.moodBarEmoji}>{cfg.emoji}</span>
                  <span className={styles.moodBarName}>{cfg.label}</span>
                  <div className={styles.moodBarTrack}>
                    <motion.div
                      className={styles.moodBarFill}
                      style={{ '--mood-color': cfg.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.06 + 0.1 }}
                    />
                  </div>
                  <span className={styles.moodBarPct}>{pct}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audio feature averages */}
      {featureAverages && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Características promedio de tu biblioteca</h3>
          <div className={styles.featureCards}>
            {[
              { key: 'energy',  label: 'Energía',  value: featureAverages.energy,  pct: true,  emoji: '⚡' },
              { key: 'valence', label: 'Valencia',  value: featureAverages.valence, pct: true,  emoji: '😊' },
              { key: 'tempo',   label: 'BPM prom.', value: featureAverages.tempo,   pct: false, emoji: '🥁' },
            ].map(({ key, label, value, pct, emoji }) => (
              <motion.div
                key={key}
                className={styles.featureCard}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className={styles.featureEmoji}>{emoji}</div>
                <div className={styles.featureValue}>
                  {pct ? `${Math.round(value * 100)}%` : Math.round(value)}
                </div>
                <div className={styles.featureLabel}>{label}</div>
                {pct && (
                  <div className={styles.featureBar}>
                    <div
                      className={styles.featureBarFill}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent library additions */}
      {tracks.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Agregadas recientemente</h3>
          <div className={styles.recentGrid}>
            {[...tracks]
              .sort((a, b) => b.addedAt - a.addedAt)
              .slice(0, 12)
              .map((track, i) => {
                const cfg = track.mood ? getMoodConfig(track.mood) : null
                return (
                  <motion.div
                    key={track.id}
                    className={styles.recentCard}
                    style={{ '--mood-color': cfg?.color || 'var(--color-accent)' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className={styles.recentArtPlaceholder}>
                      {cfg ? cfg.emoji : '🎵'}
                    </div>
                    <div className={styles.recentInfo}>
                      <div className={styles.recentName}>{track.name}</div>
                      {cfg && (
                        <div className={styles.recentMood} style={{ color: cfg.color }}>
                          {cfg.label}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </div>
      )}

      {tracks.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>📊</div>
          <div>Agrega y analiza canciones para ver estadísticas</div>
        </div>
      )}
    </div>
  )
}
