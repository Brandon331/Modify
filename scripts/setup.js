#!/usr/bin/env node
/**
 * Moodify — script de setup inicial
 * Ejecutar con: node scripts/setup.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

console.log('\n🎵  Moodify — Setup\n')

// 1. Create .env from .env.example if not exists
const envPath = path.join(ROOT, '.env')
const envExample = path.join(ROOT, '.env.example')
if (!fs.existsSync(envPath)) {
  fs.copyFileSync(envExample, envPath)
  console.log('✅  .env creado (recuerda poner tu SPOTIFY_CLIENT_ID)\n')
} else {
  console.log('ℹ️   .env ya existe\n')
}

// 2. Create backgrounds placeholder dirs
const moods = ['triste','feliz','romantica','tension','relajante','gym','nostalgica']
const bgBase = path.join(ROOT, 'src', 'renderer', 'assets', 'backgrounds')
for (const mood of moods) {
  const dir = path.join(bgBase, mood)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // Create a README in each folder
  const readme = path.join(dir, 'README.md')
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme, `# Fondos — ${mood}\n\nPon aquí tus frames de Aseprite exportados como JPG:\n\`frame_001.jpg\`, \`frame_002.jpg\`, ...\n\nRecomendado: 8-24 frames a 12 FPS.\n`)
  }
}
console.log('✅  Carpetas de fondos creadas en src/renderer/assets/backgrounds/\n')

// 3. Install dependencies
console.log('📦  Instalando dependencias...\n')
try {
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' })
  console.log('\n✅  Dependencias instaladas\n')
} catch (e) {
  console.error('❌  Error instalando dependencias. Ejecuta npm install manualmente.')
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Listo para desarrollar 🚀

 Pasos siguientes:
 1. Edita .env y pon tu SPOTIFY_CLIENT_ID
 2. En Spotify Developer Dashboard:
    - Redirect URI: moodify://callback
    - Activa "Web Playback SDK"
 3. Pon tus frames JPG en src/renderer/assets/backgrounds/{mood}/
 4. npm run dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
