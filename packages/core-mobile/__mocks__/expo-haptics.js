const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Rigid: 'rigid',
  Soft: 'soft'
}

const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error'
}

const Haptics = {
  impactAsync: jest.fn()
}

export { ImpactFeedbackStyle, NotificationFeedbackType }
export const impactAsync = Haptics.impactAsync
export default Haptics
