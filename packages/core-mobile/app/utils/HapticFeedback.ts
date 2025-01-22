import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

export function hapticFeedback(
  type: ImpactFeedbackStyle = ImpactFeedbackStyle.Light
): void {
  impactAsync(type)
}
