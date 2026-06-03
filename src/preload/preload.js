const { contextBridge, ipcRenderer } = require('electron')
const ch = require('../main/ipc/channels')

contextBridge.exposeInMainWorld('api', {
  window: {
    minimize:  () => ipcRenderer.invoke(ch.WINDOW_MINIMIZE),
    maximize:  () => ipcRenderer.invoke(ch.WINDOW_MAXIMIZE),
    close:     () => ipcRenderer.invoke(ch.WINDOW_CLOSE),
    getBounds: () => ipcRenderer.invoke(ch.WINDOW_GET_BOUNDS),
    dragMove:  (dx, dy) => ipcRenderer.invoke(ch.WINDOW_DRAG_MOVE, { dx, dy }),
  },
  library: {
    import:    ()         => ipcRenderer.invoke(ch.LIBRARY_IMPORT),
    getAll:    ()         => ipcRenderer.invoke(ch.LIBRARY_GET_ALL),
    delete:    (id)       => ipcRenderer.invoke(ch.LIBRARY_DELETE, id),
    getPath:   (id)       => ipcRenderer.invoke(ch.LIBRARY_GET_PATH, id),
    readFile:  (filePath) => ipcRenderer.invoke(ch.LIBRARY_READ_FILE, filePath),
    analyze:   (filePath) => ipcRenderer.invoke(ch.LIBRARY_ANALYZE, filePath),
  },
  store: {
    get: (key)        => ipcRenderer.invoke(ch.STORE_GET, key),
    set: (key, value) => ipcRenderer.invoke(ch.STORE_SET, key, value),
  },
  sprite: {
    load:        (filePath)        => ipcRenderer.invoke(ch.SPRITE_LOAD, filePath),
    loadByMood:  (filePath, mood)  => ipcRenderer.invoke(ch.SPRITE_LOAD_BY_MOOD, { relPath: filePath, mood }),
  },
})
