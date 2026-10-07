// Ledger derivation path constants
export enum DerivationPathKey {
  EVM = 'EVM',
  AVALANCHE = 'AVALANCHE',
  SOLANA = 'SOLANA'
}

export const DERIVATION_PATHS = {
  // BIP44 Standard paths
  BIP44: {
    [DerivationPathKey.EVM]: (accountIndex: number, addressIndex: number) =>
      `m/44'/60'/${accountIndex}'/0/${addressIndex}`,
    [DerivationPathKey.AVALANCHE]: (
      accountIndex: number,
      addressIndex: number
    ) => `m/44'/9000'/${accountIndex}'/0/${addressIndex}`,
    [DerivationPathKey.SOLANA]: (accountIndex: number, addressIndex: number) =>
      `44'/501'/${accountIndex}'/0/${addressIndex}`
  },

  // Ledger Live paths (account-based)
  LEDGER_LIVE: {
    [DerivationPathKey.EVM]: (accountIndex: number) =>
      `m/44'/60'/${accountIndex}'/0/0`,
    [DerivationPathKey.AVALANCHE]: (accountIndex: number) =>
      `m/44'/9000'/${accountIndex}'/0/0`,
    [DerivationPathKey.SOLANA]: (accountIndex: number) =>
      `44'/501'/${accountIndex}'/0`
  },

  // Extended public key paths (without final /0/0)
  EXTENDED: {
    [DerivationPathKey.EVM]: (accountIndex = 0) => `m/44'/60'/${accountIndex}'`,
    [DerivationPathKey.AVALANCHE]: (accountIndex = 0) =>
      `m/44'/9000'/${accountIndex}'`,
    [DerivationPathKey.SOLANA]: (accountIndex = 0) =>
      `m/44'/501'/${accountIndex}'`
  }
} as const

/**
 * Generate a Ledger derivation path based on the specified key and indices
 * @param key - The type of derivation path to generate (EVM, Avalanche, Solana)
 * @param accountIndex - The account index to generate the path for
 * @param addressIndex - The address index to generate the path for (default: 0)
 * @returns The complete derivation path string
 */
export const getLedgerDerivationPath = (
  key: DerivationPathKey,
  accountIndex: number,
  addressIndex = 0
): string => {
  switch (key) {
    case DerivationPathKey.EVM:
      return DERIVATION_PATHS.BIP44.EVM(accountIndex, addressIndex)
    case DerivationPathKey.AVALANCHE:
      return DERIVATION_PATHS.BIP44.AVALANCHE(accountIndex, addressIndex)
    case DerivationPathKey.SOLANA:
      return DERIVATION_PATHS.BIP44.SOLANA(accountIndex, addressIndex)
    default:
      throw new Error(`Unsupported derivation path key: ${key}`)
  }
}

/**
 * Generate a Solana derivation path for a specific account index
 * @param accountIndex - The account index to generate the path for
 * @returns The complete derivation path string
 */
export const getSolanaDerivationPath = (accountIndex: number): string => {
  return DERIVATION_PATHS.LEDGER_LIVE.SOLANA(accountIndex)
}

// Bitcoin app versions 2.4.3+ broke Core's Ledger integration.
// Users must use the Bitcoin Recovery app for versions beyond this.
export const MAX_BITCOIN_APP_VERSION = '2.4.2'

// Timeout constants
export const LEDGER_TIMEOUTS = {
  SCAN_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  APP_WAIT_TIMEOUT: 30000, // 30 seconds for waiting for app
  APP_CHECK_DELAY: 1000, // 1 second delay between app detection attempts
  REQUEST_DELAY: 3000, // 3s settle delay between quitting and opening an app
  // Hard ceiling on a single APDU round trip. The kit serializes commands per
  // session, so one command that never settles stalls every later one.
  APDU_TIMEOUT: 15000,
  // Explicit app-detection poll. The kit's session refresher only reports the
  // running app once the session reaches a Ready state, which does not happen
  // reliably over this transport, so the app type is read directly.
  APP_POLLING_INTERVAL: 2000,
  // How long to wait for the BLE link to come back after a command that makes
  // the device leave an app (open/close). The transport reconnects the same
  // session; callers just have to wait for it.
  RECONNECT_WAIT: 15000
} as const

export const LEDGER_DEVICE_BRIEF_DELAY_MS = 1000
