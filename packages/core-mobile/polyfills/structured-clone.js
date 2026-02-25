// Fusion SDK requires structuredClone
// React Native / Hermes 0.14+ has structuredClone natively, so this is a safety
// measure for older environments only. We use a conditional require to avoid
// loading @ungap/structured-clone unless actually needed, since its CJS module
// initialization is incompatible with Hermes when loaded unconditionally.
if (!('structuredClone' in global)) {
  const polyfill = require('@ungap/structured-clone')
  global.structuredClone = polyfill.default ?? polyfill
}
