const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { createWindow } = require('./window')
const { registerHandlers } = require('./ipc/handlers')

const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null

app.whenReady().then(() => {
  mainWindow = createWindow(isDev)
  registerHandlers(ipcMain, mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(isDev)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
