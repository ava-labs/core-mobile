import { showAlert } from '@avalabs/k2-alpine'
import {
  LOW_UPTIME_ALERT_BODY,
  LOW_UPTIME_ALERT_CONTINUE,
  LOW_UPTIME_ALERT_SELECT_NEW_NODE,
  LOW_UPTIME_ALERT_TITLE
} from './lowUptimeAlertCopy'
import { isUptimeBelowRequirement } from './uptimeRequirement'

/** The "Uptime too low" warning. Never blocks: Continue always proceeds. */
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
    // Non-cancelable so the buttons stay the only user exit. Android can still
    // drop the dialog on activity recreation, so onDismiss clears the flag too.
    options: { cancelable: false, onDismiss: resetLowUptimeAlertState }
  })
}

// True while the warning is on screen. The alert is non-cancelable, so its
// buttons are the only exit; a repeat tap meanwhile must not stack a second one.
let isLowUptimeAlertOpen = false

/**
 * Clears the in-flight flag. The screens that raise the alert call this on
 * unmount, so an alert closed without a button press (e.g. the screen went
 * away under it) cannot block every later warning; tests call it between cases.
 */
export const resetLowUptimeAlertState = (): void => {
  isLowUptimeAlertOpen = false
}

/**
 * Commit-point guard shared by Node details ("Select this node") and the
 * review screen ("Slide to stake"). Runs `onProceed` straight away when the
 * node meets the uptime requirement (or uptime is unknown); otherwise shows
 * the warning and lets the user continue or pick another node. Returns
 * synchronously in both cases so a calling SlidingButton resets right away.
 */
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
    // No alert is on screen, so do not leave later warnings blocked.
    isLowUptimeAlertOpen = false
    throw error
  }
}
