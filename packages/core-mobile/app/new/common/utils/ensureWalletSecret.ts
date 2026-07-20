import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

/**
 * Deterministic decrypt failures for structurally corrupt secret data. These
 * are thrown by `decrypt` (see EncryptionHelper) and can never succeed on
 * retry, so they are terminal rather than transient. Matched by `error.name`
 * because the messages are dynamic. (CP-14585)
 */
const TERMINAL_SECRET_ERROR_NAMES = ['NoSaltError', 'InvalidVersionError']

/**
 * A wallet secret failure is *terminal* (the secret can never unlock the
 * wallet) only when the credential is genuinely absent, cannot be decrypted, or
 * the stored data is structurally corrupt. A transient keychain/IO error must
 * NOT be treated as a missing secret, or a flaky read would destroy a real
 * wallet. (CP-14585)
 */
const isTerminalSecretError = (error?: Error): boolean => {
  const message = error?.message ?? ''
  return (
    message.includes('No credentials found') ||
    message.includes('Failed to decrypt') ||
    message.includes('BAD_DECRYPT') || // Android bad-decrypt
    message.includes('Decrypt failed') || // iOS bad-decrypt
    // Corrupt/unreadable secret data (missing salt, unknown version) — a
    // deterministic failure that will never decrypt on retry.
    (error?.name !== undefined &&
      TERMINAL_SECRET_ERROR_NAMES.includes(error.name))
  )
}

/**
 * Loads the wallet secret for the given wallet after a successful PIN/biometry
 * check. If the secret is genuinely missing or cannot be decrypted, the wallet
 * can never unlock (e.g. an interrupted wallet deletion removed the secret while
 * the encryption key survived). In that case we invoke `onMissing` — typically a
 * wallet delete that routes the user to onboarding — instead of silently
 * leaving them stuck on the PIN screen. (CP-14585)
 *
 * A transient keychain/IO failure is rethrown (not treated as missing) so the
 * caller can log and let the user retry rather than destroying a real wallet.
 *
 * @returns true if the secret loaded and login can proceed, false if recovery
 * was triggered and login should be aborted.
 * @throws if the secret failed to load for a non-terminal (transient) reason.
 */
export const ensureWalletSecret = async (
  walletId: string,
  onMissing: () => void
): Promise<boolean> => {
  const result = await BiometricsSDK.loadWalletSecret(walletId)
  if (result.success) {
    return true
  }

  if (isTerminalSecretError(result.error)) {
    Logger.error(
      'Wallet secret missing after PIN verification; deleting wallet',
      result.error
    )
    onMissing()
    return false
  }

  throw result.error ?? new Error('Failed to load wallet secret')
}
