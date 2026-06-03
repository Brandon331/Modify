const { BrowserWindow, dialog, app } = require('electron')
const { analyzeMp3File } = require('./mp3Analyzer')
const { loadAsepriteFrames, loadAsepriteByMood } = require('./asepriteLoader')
const Store = require('electron-store')
const path = require('path')
const fs = require('fs')
const ch = require('./channels')

const appStore = new Store({ name: 'moodify-prefs' })

function getLibraryDir() {
  const dir = path.join(app.getPath('userData'), 'moodify-library')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getLibraryJsonPath() {
  return path.join(app.getPath('userData'), 'library.json')
}

function loadLibrary() {
  const jsonPath = getLibraryJsonPath()
  if (!fs.existsSync(jsonPath)) return []
  try { return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) }
  catch { return [] }
}

function saveLibrary(tracks) {
  fs.writeFileSync(getLibraryJsonPath(), JSON.stringify(tracks, null, 2), 'utf-8')
}

function registerHandlers(ipcMain, mainWindow) {
  // ── Window controls ───────────────────────────────────────────────
  ipcMain.handle(ch.WINDOW_MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.handle(ch.WINDOW_MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle(ch.WINDOW_CLOSE, () => BrowserWindow.getFocusedWindow()?.close())

  // Drag: el renderer envía el delta de movimiento acumulado desde mousedown
  // Se usa sendSync para minimizar latencia visual durante el drag
  ipcMain.handle(ch.WINDOW_GET_BOUNDS, () => {
    const win = BrowserWindow.getFocusedWindow()
    return win ? win.getBounds() : null
  })
  ipcMain.handle(ch.WINDOW_DRAG_MOVE, (event, { dx, dy }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win || win.isMaximized()) return
    const [x, y] = win.getPosition()
    // setPosition en lugar de setBounds para NO tocar width/height
    win.setPosition(x + Math.round(dx), y + Math.round(dy), false)
  })

  // ── Library ───────────────────────────────────────────────────────
  ipcMain.handle(ch.LIBRARY_IMPORT, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleccionar canciones',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Audio', extensions: ['mp3'] }],
    })
    if (result.canceled || !result.filePaths.length) return []

    const libraryDir = getLibraryDir()
    const library = loadLibrary()
    const added = []

    for (const srcPath of result.filePaths) {
      const filename = path.basename(srcPath)
      if (library.some(t => t.originalName === filename)) continue

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const destPath = path.join(libraryDir, `${id}_${filename}`)
      fs.copyFileSync(srcPath, destPath)

      const track = {
        id,
        name: filename.replace(/\.mp3$/i, ''),
        originalName: filename,
        filePath: destPath,
        addedAt: Date.now(),
        mood: null,
        features: null,
      }
      library.push(track)
      added.push(track)
    }

    saveLibrary(library)
    return added
  })

  ipcMain.handle(ch.LIBRARY_GET_ALL, () => loadLibrary())

  ipcMain.handle(ch.LIBRARY_DELETE, (event, id) => {
    const library = loadLibrary()
    const track = library.find(t => t.id === id)
    if (track && fs.existsSync(track.filePath)) fs.unlinkSync(track.filePath)
    saveLibrary(library.filter(t => t.id !== id))
    return { success: true }
  })

  ipcMain.handle(ch.LIBRARY_GET_PATH, (event, id) => {
    return loadLibrary().find(t => t.id === id)?.filePath || null
  })

  // ← NUEVO: lee el archivo y devuelve sus bytes al renderer
  // El renderer no puede hacer fetch('file://') pero el main sí puede leer con fs
  ipcMain.handle(ch.LIBRARY_READ_FILE, (event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath) // devuelve Buffer, IPC lo serializa automáticamente
  })

  // ── Audio Analysis (main process, no AudioContext) ───────────────────────
  ipcMain.handle(ch.LIBRARY_ANALYZE, (event, filePath) => {
    return analyzeMp3File(filePath)
  })

  // ── Store ─────────────────────────────────────────────────────────
  ipcMain.handle(ch.STORE_SET, (event, key, value) => {
    if (key.startsWith('track-mood:')) {
      const id = key.replace('track-mood:', '')
      const library = loadLibrary()
      const idx = library.findIndex(t => t.id === id)
      if (idx !== -1) {
        library[idx].mood = value.mood
        library[idx].features = value.features
        saveLibrary(library)
      }
    } else {
      appStore.set(key, value)
    }
    return { success: true }
  })

  ipcMain.handle(ch.STORE_GET, (event, key) => appStore.get(key) ?? null)

  // ── Sprite / Aseprite ─────────────────────────────────────────────
  ipcMain.handle(ch.SPRITE_LOAD, (event, relPath) => {
    try {
      const root = app.getAppPath()
      const absPath = path.join(root, relPath)
      if (!fs.existsSync(absPath)) return { error: 'Archivo no encontrado: ' + absPath }
      const data = loadAsepriteFrames(absPath)
      return { ok: true, ...data }
    } catch (err) {
      console.error('[sprite:load]', err)
      return { error: err.message }
    }
  })

  // Carga los frames de la layer correspondiente al mood
  ipcMain.handle(ch.SPRITE_LOAD_BY_MOOD, (event, { relPath, mood }) => {
    try {
      const root = app.getAppPath()
      const absPath = path.join(root, relPath)
      if (!fs.existsSync(absPath)) return { error: 'Archivo no encontrado: ' + absPath }
      const data = loadAsepriteByMood(absPath, mood)
      if (!data) return { error: 'No se encontraron frames para mood: ' + mood }
      return { ok: true, ...data }
    } catch (err) {
      console.error('[sprite:load-by-mood]', err)
      return { error: err.message }
    }
  })
}

module.exports = { registerHandlers }
