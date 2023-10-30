import { trigger, HapticFeedbackTypes } from 'react-native-haptic-feedback'

export function hapticFeedback(
  type: HapticFeedbackTypes = HapticFeedbackTypes.impactLight,
  force = false
): void {
  trigger(type, {
    enableVibrateFallback: force,
    ignoreAndroidSystemSettings: force
  })
}
