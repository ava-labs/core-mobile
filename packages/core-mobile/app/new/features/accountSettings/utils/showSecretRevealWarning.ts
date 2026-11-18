import { showAlert } from '@avalabs/k2-alpine'

export type SecretType = 'recoveryPhrase' | 'privateKey'

const SECRET_LABEL: Record<SecretType, string> = {
  recoveryPhrase: 'recovery phrase',
  privateKey: 'private key'
}

export const getSecretRevealWarningCopy = (
  secretType: SecretType
): { title: string; description: string } => {
  const label = SECRET_LABEL[secretType]
  return {
    title: `Never share your ${label}`,
    description:
      `Anyone with your ${label} can take full control of your wallet and steal your funds.\n\n` +
      `• Never share it with anyone, or enter it on any website or app.\n` +
      `• Core will never ask for your ${label}.\n` +
      `• Make sure no one can see your screen.`
  }
}

/**
 * WSR-PHYS-003: warn about the risks BEFORE any recovery phrase or private
 * key is revealed. `onContinue` is only called when the user explicitly
 * confirms; Cancel (or dismissing the alert) leaves the user where they are.
 */
export const showSecretRevealWarning = ({
  secretType,
  onContinue
}: {
  secretType: SecretType
  onContinue: () => void
}): void => {
  const { title, description } = getSecretRevealWarningCopy(secretType)
  showAlert({
    title,
    description,
    buttons: [
      {
        text: 'Cancel'
      },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: onContinue
      }
    ]
  })
}
