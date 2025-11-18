// Ledger derivation path constants
export const DERIVATION_PATHS = {
  // BIP44 Standard paths
  BIP44: {
    EVM: "m/44'/60'/0'/0/0",
    AVALANCHE: "m/44'/9000'/0'/0/0",
    PVM: "m/44'/9000'/0'/0/0", // Same as Avalanche for now
    SOLANA: "m/44'/501'/0'/0/0",
    BITCOIN: "m/44'/0'/0'/0/0"
  },

  // Ledger Live paths (account-based)
  LEDGER_LIVE: {
    EVM: (accountIndex: number) => `m/44'/60'/${accountIndex}'/0/0`,
    AVALANCHE: (accountIndex: number) => `m/44'/9000'/${accountIndex}'/0/0`,
    PVM: (accountIndex: number) => `m/44'/9000'/${accountIndex}'/0/0`,
    SOLANA: (accountIndex: number) => `m/44'/501'/${accountIndex}'/0/0`,
    BITCOIN: (accountIndex: number) => `m/44'/0'/${accountIndex}'/0/0`
  },

  // Extended public key paths (without final /0/0)
  EXTENDED: {
    EVM: "m/44'/60'/0'",
    AVALANCHE: "m/44'/9000'/0'"
  }
} as const

// Raw derivation paths for Solana (without m/ prefix)
export const SOLANA_DERIVATION_PATH = "44'/501'/0'/0/0"

// Solana derivation path prefix for generating indexed paths
export const SOLANA_DERIVATION_PATH_PREFIX = "44'/501'/0'/0"

/**
 * Generate a Solana derivation path for a specific account index
 * @param accountIndex - The account index to generate the path for
 * @returns The complete derivation path string
 */
export const getSolanaDerivationPath = (accountIndex: number): string => {
  return `${SOLANA_DERIVATION_PATH_PREFIX}/${accountIndex}`
}

// Timeout constants
export const LEDGER_TIMEOUTS = {
  SCAN_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  APP_WAIT_TIMEOUT: 30000, // 30 seconds for waiting for app
  APP_POLLING_INTERVAL: 2000, // 2 seconds between app checks
  APP_CHECK_DELAY: 1000 // 1 second delay between app detection attempts
} as const
