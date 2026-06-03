# Sprites — archivos Aseprite nativos

Pon aquí el archivo directamente, SIN convertir:

  Sprite-0001.aseprite   ← tal cual, el archivo original de Aseprite

La app lo lee nativa via IPC (proceso main de Electron usando ase-parser),
lo compone frame a frame en RGBA y lo anima en <canvas> en el renderer.
No necesitas exportar a PNG ni GIF.

Si el archivo tiene otro nombre, ajusta SPRITE_FILENAME en:
  src/renderer/components/CloudSprite/CloudSprite.jsx
