const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Rigid: 'rigid',
  Soft: 'soft'
}

const Haptics = {
  impactAsync: jest.fn()
}

export { ImpactFeedbackStyle }
export const impactAsync = Haptics.impactAsync
export default Haptics
