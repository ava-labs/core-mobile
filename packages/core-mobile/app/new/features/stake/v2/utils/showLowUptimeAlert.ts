import { showAlert } from '@avalabs/k2-alpine'
import {
  LOW_UPTIME_ALERT_BODY,
  LOW_UPTIME_ALERT_CONTINUE,
  LOW_UPTIME_ALERT_SELECT_NEW_NODE,
  LOW_UPTIME_ALERT_TITLE
} from './lowUptimeAlertCopy'
import { isUptimeBelowRequirement } from './uptimeRequirement'

export const showLowUptimeAlert = ({
  onContinue,
  onSelectNewNode
}: {
  onContinue: () => void
  onSelectNewNode: () => void
}): void => {
  showAlert({
    title: LOW_UPTIME_ALERT_TITLE,
    description: LOW_UPTIME_ALERT_BODY,
    buttons: [
      { text: LOW_UPTIME_ALERT_CONTINUE, onPress: onContinue },
      { text: LOW_UPTIME_ALERT_SELECT_NEW_NODE, onPress: onSelectNewNode }
    ],
    // Android can still drop a non-cancelable alert on activity recreation.
    options: { cancelable: false, onDismiss: resetLowUptimeAlertState }
  })
}

// Stops a repeat tap from stacking a second alert while one is open.
let isLowUptimeAlertOpen = false

export const resetLowUptimeAlertState = (): void => {
  isLowUptimeAlertOpen = false
}

// Must stay synchronous so a calling SlidingButton resets right away.
export const proceedOrWarnLowUptime = ({
  uptime,
  onProceed,
  onSelectNewNode
}: {
  uptime: string | number | undefined
  onProceed: () => void
  onSelectNewNode: () => void
}): void => {
  if (!isUptimeBelowRequirement(uptime)) {
    onProceed()
    return
  }
  if (isLowUptimeAlertOpen) return
  isLowUptimeAlertOpen = true
  try {
    showLowUptimeAlert({
      onContinue: () => {
        isLowUptimeAlertOpen = false
        onProceed()
      },
      onSelectNewNode: () => {
        isLowUptimeAlertOpen = false
        onSelectNewNode()
      }
    })
  } catch (error) {
    isLowUptimeAlertOpen = false
    throw error
  }
}
