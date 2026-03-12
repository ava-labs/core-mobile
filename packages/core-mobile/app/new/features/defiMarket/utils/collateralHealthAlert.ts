import { showAlert } from '@avalabs/k2-alpine'
import { formatHealthScore } from './healthRisk'

/**
 * Shows an alert when the user tries to disable a collateral asset.
 * - If newScore <= 1.0: blocking alert (would trigger liquidation)
 * - If newScore > 1.0: warning alert with confirm/cancel
 * Returns true if the user confirms, false otherwise.
 */
export const showHealthImpactAlert = (
  symbol: string,
  currentScore: number,
  newScore: number
): Promise<boolean> => {
  if (newScore <= 1.0) {
    return new Promise(resolve => {
      showAlert({
        title: 'Unable to disable collateral',
        description: `Removing ${symbol} as collateral will lower your health score below 1.0, triggering liquidation.`,
        buttons: [{ text: 'Got it', onPress: () => resolve(false) }],
        options: { cancelable: false }
      })
    })
  }

  return new Promise(resolve => {
    showAlert({
      title: 'Health score impact warning',
      description: `Removing ${symbol} as collateral will reduce your health score from ${formatHealthScore(
        currentScore,
        { fractionDigits: 2 }
      )} to ${formatHealthScore(newScore, { fractionDigits: 2 })}`,
      buttons: [
        { text: 'Cancel', onPress: () => resolve(false) },
        {
          text: `Disable ${symbol}`,
          style: 'destructive',
          onPress: () => resolve(true)
        }
      ],
      options: { cancelable: true, onDismiss: () => resolve(false) }
    })
  })
}
