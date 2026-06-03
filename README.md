# Moodify 🎵

Reproductor de música local con análisis de mood automático.

## Qué hace

- Importa tus MP3s y los guarda en una biblioteca propia de la app
- Analiza cada canción con Web Audio API: BPM, energía y brillo espectral
- Clasifica el mood: Gym 🔥, Feliz ☀️, Romántica 🌹, Relajante 🌿, Tensión ⚡, Nostálgica 🍂, Triste 💙
- Recuerda los moods entre sesiones — no re-analiza al volver a abrir
- Fondo animado que cambia según el mood
- Filtros por mood en la biblioteca
- Cola de reproducción automática

## Setup

```bash
npm install
npm run dev
```

## Estructura

```
src/
  main/             # Electron main process
    ipc/            # IPC handlers: gestión de archivos, biblioteca
  preload/          # Bridge renderer ↔ main
  renderer/
    engine/
      moodClassifier.js   # Clasificación por energy/valence/tempo
      audioAnalyzer.js    # Extracción de features con Web Audio API
    pages/
      Library/      # Lista de canciones + import + análisis
      Player/       # Reproductor con HTML <audio>
      Stats/        # Historial de moods
    store/
      libraryStore.js  # Estado + persistencia de la biblioteca
      playerStore.js   # Cola y estado del reproductor
      moodStore.js     # Mood actual e historial
```

## Cómo funciona el análisis

1. El archivo MP3 se decodifica con Web Audio API en el renderer
2. Se calculan tres features:
   - **Energy** (RMS): qué tan fuerte/intensa es la canción
   - **Tempo** (BPM): detección de onsets en la envolvente de energía
   - **Valence**: centroide espectral normalizado (brillante = más positivo)
3. Los valores se pasan al clasificador de umbrales (`moodClassifier.js`)
4. El resultado se guarda en `userData/library.json` — nunca se re-analiza
