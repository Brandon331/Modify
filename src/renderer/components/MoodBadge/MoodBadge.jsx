import React from 'react'
import { getMoodConfig } from '../../engine/moodClassifier'
import styles from './MoodBadge.module.css'

export default function MoodBadge({ mood, size = 'md', showLabel = true }) {
  const cfg = getMoodConfig(mood)

  return (
    <div
      className={`${styles.badge} ${styles[size]}`}
      style={{ '--mood-color': cfg.color }}
    >
      <span className={styles.emoji}>{cfg.emoji}</span>
      {showLabel && <span className={styles.label}>{cfg.label}</span>}
    </div>
  )
}
