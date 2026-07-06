import * as Haptics from 'expo-haptics'

export const fireSelectionHaptic = (): void => {
  Haptics.selectionAsync().catch(() => undefined)
}

export const fireResetHaptic = (): void => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
}

export const fireSuccessHaptic = (): Promise<void> => {
  return Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success
  ).catch(() => undefined)
}

export const fireErrorHaptic = (): Promise<void> => {
  return Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Error
  ).catch(() => undefined)
}
