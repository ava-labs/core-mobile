import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType
} from 'expo-haptics'

export function hapticFeedback(
  type:
    | ImpactFeedbackStyle
    | NotificationFeedbackType = ImpactFeedbackStyle.Light
): void {
  switch (type) {
    case ImpactFeedbackStyle.Light:
    case ImpactFeedbackStyle.Medium:
    case ImpactFeedbackStyle.Heavy:
    case ImpactFeedbackStyle.Soft:
    case ImpactFeedbackStyle.Rigid:
      impactAsync(type)
      break
    case NotificationFeedbackType.Success:
    case NotificationFeedbackType.Warning:
    case NotificationFeedbackType.Error:
      notificationAsync(type)
      break
    default:
      impactAsync(ImpactFeedbackStyle.Light)
      break
  }
}
