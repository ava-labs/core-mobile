import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions'
import structuredClone from '@ungap/structured-clone'

// Fusion SDK requires structuredClone and it's not available in react-native
// so we need to polyfill it
if (!('structuredClone' in global)) {
  polyfillGlobal('structuredClone', () => structuredClone)
}
