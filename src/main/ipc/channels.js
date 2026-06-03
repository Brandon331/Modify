module.exports = {
  // Window controls
  WINDOW_MINIMIZE:    'window:minimize',
  WINDOW_MAXIMIZE:    'window:maximize',
  WINDOW_CLOSE:       'window:close',
  WINDOW_DRAG_START:  'window:drag-start',   // inicia drag (mousedown en titlebar)
  WINDOW_DRAG_MOVE:   'window:drag-move',    // mueve ventana con delta x/y
  WINDOW_GET_BOUNDS:  'window:get-bounds',   // devuelve { x, y, width, height }

  // Library (MP3 files)
  LIBRARY_IMPORT:     'library:import',
  LIBRARY_GET_ALL:    'library:get-all',
  LIBRARY_DELETE:     'library:delete',
  LIBRARY_GET_PATH:   'library:get-path',
  LIBRARY_READ_FILE:  'library:read-file',

  // Audio analysis (done in main process — no AudioContext crash)
  LIBRARY_ANALYZE:    'library:analyze',

  // App store
  STORE_GET:          'store:get',
  STORE_SET:          'store:set',

  // Sprite / Aseprite
  SPRITE_LOAD:           'sprite:load',
  SPRITE_LOAD_BY_MOOD:   'sprite:load-by-mood',
}
