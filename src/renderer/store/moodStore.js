import { create } from 'zustand'

export const useMoodStore = create((set, get) => ({
  currentMood: 'default',
  moodHistory: [],          // [{ mood, trackId, timestamp }]
  playlistMoods: {},        // { playlistId: { mood: count } }

  setMood: (mood) => {
    const prev = get().currentMood
    if (prev === mood) return
    set(s => ({
      currentMood: mood,
      moodHistory: [
        { mood, timestamp: Date.now() },
        ...s.moodHistory.slice(0, 99),
      ],
    }))
  },

  setPlaylistMoods: (playlistId, moodCounts) => {
    set(s => ({
      playlistMoods: { ...s.playlistMoods, [playlistId]: moodCounts },
    }))
  },

  getMoodStats: () => {
    const history = get().moodHistory
    const counts = {}
    history.forEach(({ mood }) => {
      counts[mood] = (counts[mood] || 0) + 1
    })
    return counts
  },
}))
