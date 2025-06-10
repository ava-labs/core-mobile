import { PublicKey } from '@solana/web3.js'

export const isSolanaAddress = (address: string): boolean => {
  try {
    // We use isOnCurve instead of just 'new PublicKey()' for two reasons:
    // 1. ESLint warns against using 'new' keyword without actually using the instance
    // 2. It provides stronger validation by checking if the key is on the ed25519 curve
    PublicKey.isOnCurve(new PublicKey(address))
    return true
  } catch {
    return false
  }
}
