import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

/**
 * Loads the wallet secret for the given wallet after a successful PIN/biometry
 * check. If the secret is missing or cannot be decrypted, the wallet can never
 * unlock (e.g. an interrupted wallet deletion removed the secret while the
 * encryption key survived). In that case we invoke `onMissing` — typically a
 * wallet delete that routes the user to onboarding — instead of silently
 * leaving them stuck on the PIN screen. (CP-14585)
 *
 * @returns true if the secret loaded and login can proceed, false if recovery
 * was triggered and login should be aborted.
 */
export const ensureWalletSecret = async (
  walletId: string,
  onMissing: () => void
): Promise<boolean> => {
  const result = await BiometricsSDK.loadWalletSecret(walletId)
  if (!result.success) {
    Logger.error(
      'Wallet secret missing after PIN verification; deleting wallet',
      result.error
    )
    onMissing()
    return false
  }
  return true
}
