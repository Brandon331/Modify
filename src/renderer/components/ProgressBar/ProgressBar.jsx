import React from 'react'
import styles from './ProgressBar.module.css'

export default function ProgressBar({ value = 0, max = 100, color, onClick, showThumb = false, height = 4 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div
      className={styles.track}
      style={{ '--h': `${height}px`, '--mood-color': color || 'var(--color-accent)' }}
      onClick={onClick}
    >
      <div className={styles.fill} style={{ width: `${pct}%` }} />
      {showThumb && (
        <div className={styles.thumb} style={{ left: `${pct}%` }} />
      )}
    </div>
  )
}
