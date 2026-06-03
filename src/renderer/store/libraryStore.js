import { create } from 'zustand'

// Persistent library store — syncs with main process library.json via IPC
export const useLibraryStore = create((set, get) => ({
  tracks: [],           // full list from library.json
  isLoading: false,
  currentTrackId: null, // ID of the track currently playing

  // Load all tracks from the persisted library
  loadLibrary: async () => {
    set({ isLoading: true })
    const tracks = await window.api.library.getAll()
    set({ tracks, isLoading: false })
  },

  // Import new MP3s via file dialog
  importFiles: async () => {
    const added = await window.api.library.import()
    if (added.length) {
      set(s => ({ tracks: [...s.tracks, ...added] }))
    }
    return added
  },

  // Persist analyzed mood+features to library.json
  saveMood: async (id, mood, features) => {
    await window.api.store.set(`track-mood:${id}`, { mood, features })
    set(s => ({
      tracks: s.tracks.map(t =>
        t.id === id ? { ...t, mood, features } : t
      ),
    }))
  },

  // Delete a track from library
  deleteTrack: async (id) => {
    await window.api.library.delete(id)
    set(s => ({ tracks: s.tracks.filter(t => t.id !== id) }))
  },

  setCurrentTrack: (id) => set({ currentTrackId: id }),

  getTrackById: (id) => get().tracks.find(t => t.id === id) || null,
}))
