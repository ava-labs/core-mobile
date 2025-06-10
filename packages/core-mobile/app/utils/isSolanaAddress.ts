export const isSolanaAddress = (address: string): boolean => {
  try {
    // Base58 check for Solana addresses
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return base58Regex.test(address)
  } catch {
    return false
  }
}
