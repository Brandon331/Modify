import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { usePlayerStore } from '../../store/playerStore'
import { useMoodStore } from '../../store/moodStore'
import { getMoodConfig } from '../../engine/moodClassifier'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/library', icon: '♫',  label: 'Biblioteca' },
  { to: '/player',  icon: '▶',  label: 'Reproductor' },
  { to: '/stats',   icon: '◈',  label: 'Estadísticas' },
]

export default function Layout() {
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const currentMood = useMoodStore(s => s.currentMood)
  const moodCfg = getMoodConfig(currentMood)

  return (
    <div className={styles.root}>
      {/* Custom titlebar */}
      <div className={styles.titlebar}>
        <div className={styles.titlebarDrag} />
        <div className={styles.windowControls}>
          <button onClick={() => window.api.window.minimize()} className={styles.winBtn}>─</button>
          <button onClick={() => window.api.window.maximize()} className={styles.winBtn}>□</button>
          <button onClick={() => window.api.window.close()}    className={`${styles.winBtn} ${styles.winClose}`}>✕</button>
        </div>
      </div>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <span className={styles.logoEmoji}>{moodCfg.emoji}</span>
            <span className={styles.logoText}>Moodify</span>
          </div>

          {currentMood !== 'default' && (
            <div className={styles.moodIndicator} style={{ '--mood-color': moodCfg.color }}>
              <span className={styles.moodDot} />
              <span>{moodCfg.label}</span>
            </div>
          )}

          <nav className={styles.nav}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navActive : ''}`
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Now playing mini info at bottom of sidebar */}
          {currentTrack && (
            <div className={styles.nowPlaying}>
              <div className={styles.nowDot} style={{ background: moodCfg.color }} />
              <div className={styles.nowName}>{currentTrack.name}</div>
            </div>
          )}
        </aside>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
