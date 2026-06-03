/* eslint-disable no-console */
// Stub @avalabs/crypto-sdk; tests that exercise derivation must spy on the
// vm-module's deriveAddresses (or mock the module) — the native bindings
// pulled in by the RN exports condition aren't available under node.
jest.mock('@avalabs/crypto-sdk', () => ({
  init: jest.fn(),
  deriveAddressesForEvm: jest.fn(),
  deriveAddressesForBtc: jest.fn(),
  deriveAddressesForAvalanche: jest.fn(),
  deriveAddressesForSvm: jest.fn(),
  deriveAddressesFromXpubs: jest.fn(),
  MAX_BATCH_SIZE: 100
}))

// The patched @noble/curves (see .yarn/patches/@noble-curves-*.patch) imports
// @avalabs/crypto-nitro at module load. An empty mock makes each native
// lookup undefined; the patch's try/catch then falls back to JS, which is
// what we want under tests.
jest.mock('@avalabs/crypto-nitro', () => ({}))

// Silence the noble-curves fallback log so test output isn't drowned in it.
const _originalConsoleLog = console.log
console.log = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].startsWith('Native lib failed, falling back to JS implementation')
  ) {
    return
  }
  _originalConsoleLog.apply(console, args)
}
