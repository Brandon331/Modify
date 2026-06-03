const { BrowserWindow } = require('electron')
const path = require('path')

function createWindow(isDev) {
  const preloadPath = path.join(__dirname, '../preload/preload.js')

  const win = new BrowserWindow({
    width: 320,
    height: 480,
    minWidth: 280,
    minHeight: 400,
    maxWidth: 400,
    maxHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    resizable: true,
    movable: true,           // ← permite mover la ventana
    hasShadow: true,
    transparent: true,       // necesario para esquinas sin borde nativo
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    // DevTools abierto en dev para poder ver errores
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(['media', 'notifications'].includes(permission))
  })

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173",
            "media-src 'self' file: blob:",
            "connect-src 'self' file: http://localhost:5173 ws://localhost:5173",
            "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: http://localhost:5173",
          ].join('; ')
        ]
      }
    })
  })

  return win
}

module.exports = { createWindow }