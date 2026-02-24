import structuredClone from '@ungap/structured-clone'

const setupPolyfills = async () => {
  const { polyfillGlobal } = await import(
    'react-native/Libraries/Utilities/PolyfillFunctions'
  )

  if (!('structuredClone' in global)) {
    polyfillGlobal('structuredClone', () => structuredClone)
  }
}

setupPolyfills()
