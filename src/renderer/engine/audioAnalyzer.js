/**
 * audioAnalyzer.js
 *
 * El análisis ocurre en el MAIN PROCESS (Node.js) a través de IPC,
 * no en el renderer. Esto evita completamente el crash de AudioContext
 * al intentar decodificar MP3s largos (~100 MB PCM descomprimido).
 *
 * El main process lee solo los primeros 600 KB del MP3, parsea los
 * frames MPEG directamente y extrae energy/tempo/valence/zcr sin
 * necesitar AudioContext ni librerías nativas.
 */

export async function analyzeAudioFile(filePath) {
  if (!filePath) throw new Error('filePath requerido')

  const result = await window.api.library.analyze(filePath)

  if (!result || result.error) {
    throw new Error(result?.error || 'Error desconocido en análisis')
  }

  return result // { energy, tempo, valence, zcr }
}
