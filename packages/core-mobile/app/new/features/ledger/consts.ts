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

// Timeout constants
export const LEDGER_TIMEOUTS = {
  SCAN_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  APP_WAIT_TIMEOUT: 30000, // 30 seconds for waiting for app
  APP_POLLING_INTERVAL: 2000, // 2 seconds between app checks
  APP_CHECK_DELAY: 1000, // 1 second delay between app detection attempts
  REQUEST_DELAY: 3000 // 3s delay between APDU commands
} as const

export const LEDGER_DEVICE_BRIEF_DELAY_MS = 1000
