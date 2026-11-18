import Clipboard from '@react-native-clipboard/clipboard'
import { AppState, NativeEventSubscription } from 'react-native'
import Logger from 'utils/Logger'
import { showSnackbar } from './toast'

export const copyToClipboard = (str?: string, message = 'Copied'): void => {
  if (str) {
    Clipboard.setString(str)
    showSnackbar(message)
  } else {
    Clipboard.setString('') //better to clean clipboard than let user paste something unintentionally
  }
}

/** How long a copied secret (recovery phrase / private key) may stay in the clipboard. */
export const SECRET_CLIPBOARD_TTL_MS = 60 * 1000

export const SECRET_COPIED_MESSAGE =
  'Copied. Clipboard will be cleared in 60 seconds'

type PendingSecretClear = {
  secret: string
  expiresAt: number
  timer: ReturnType<typeof setTimeout>
  appStateSubscription: NativeEventSubscription
}

let pendingSecretClear: PendingSecretClear | undefined

const cancelPendingSecretClear = (): void => {
  if (!pendingSecretClear) return
  clearTimeout(pendingSecretClear.timer)
  pendingSecretClear.appStateSubscription.remove()
  pendingSecretClear = undefined
}

/**
 * Clears the clipboard, but only if it still holds the secret we copied, so we
 * never wipe something the user copied afterwards.
 */
const clearSecretIfStillInClipboard = async (): Promise<void> => {
  const pending = pendingSecretClear
  if (!pending) return
  cancelPendingSecretClear()
  try {
    const current = await Clipboard.getString()
    if (current === pending.secret) {
      Clipboard.setString('')
    }
  } catch (error) {
    Logger.error('Failed to clear secret from clipboard', error)
  }
}

/**
 * WSR-PHYS-001: copies a secret (recovery phrase / private key) to the
 * clipboard, tells the user it will be cleared, and clears it after
 * {@link SECRET_CLIPBOARD_TTL_MS} if the clipboard still holds it.
 *
 * JS timers don't run while the app is in the background, so the expiry is
 * also re-checked whenever the app becomes active again.
 */
export const copySecretToClipboard = (
  secret?: string,
  message = SECRET_COPIED_MESSAGE
): void => {
  if (!secret) return

  cancelPendingSecretClear()
  copyToClipboard(secret, message)

  const expiresAt = Date.now() + SECRET_CLIPBOARD_TTL_MS
  const timer = setTimeout(() => {
    clearSecretIfStillInClipboard()
  }, SECRET_CLIPBOARD_TTL_MS)
  const appStateSubscription = AppState.addEventListener('change', state => {
    if (state === 'active' && Date.now() >= expiresAt) {
      clearSecretIfStillInClipboard()
    }
  })

  pendingSecretClear = { secret, expiresAt, timer, appStateSubscription }
}
