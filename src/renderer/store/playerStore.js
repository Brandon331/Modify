import { create } from 'zustand'

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,  // full track object from libraryStore
  isPlaying: false,
  progress: 0,         // seconds
  duration: 0,         // seconds
  volume: 0.8,
  queue: [],           // array of track IDs
  queueIndex: -1,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setProgress: (s) => set({ progress: s }),
  setDuration: (s) => set({ duration: s }),
  setVolume: (v) => set({ volume: v }),

  setQueue: (trackIds, startIndex = 0) =>
    set({ queue: trackIds, queueIndex: startIndex }),

  nextTrack: () => {
    const { queue, queueIndex } = get()
    if (queueIndex < queue.length - 1) {
      set({ queueIndex: queueIndex + 1 })
      return queue[queueIndex + 1]
    }
    return null
  },

  prevTrack: () => {
    const { queue, queueIndex } = get()
    if (queueIndex > 0) {
      set({ queueIndex: queueIndex - 1 })
      return queue[queueIndex - 1]
    }
    return null
  },

  currentTrackId: () => {
    const { queue, queueIndex } = get()
    return queue[queueIndex] ?? null
  },
}))
