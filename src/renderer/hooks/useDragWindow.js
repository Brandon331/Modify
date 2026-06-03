/**
 * useDragWindow.js
 *
 * Ya no hace nada — el drag se maneja con -webkit-app-region: drag
 * directamente en el CSS de la TitleBar (método nativo de Electron).
 * Este archivo existe solo para no romper el import en App.jsx.
 */
export function useDragWindow() {
  return {}
}
