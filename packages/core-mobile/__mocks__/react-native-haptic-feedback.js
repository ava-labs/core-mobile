const HapticFeedbackTypes = {
  selection: 'selection',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  impactHeavy: 'impactHeavy',
  rigid: 'rigid',
  soft: 'soft',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  notificationError: 'notificationError',
  clockTick: 'clockTick',
  contextClick: 'contextClick',
  keyboardPress: 'keyboardPress',
  keyboardRelease: 'keyboardRelease',
  keyboardTap: 'keyboardTap',
  longPress: 'longPress',
  textHandleMove: 'textHandleMove',
  virtualKey: 'virtualKey',
  virtualKeyRelease: 'virtualKeyRelease',
  effectClick: 'effectClick',
  effectDoubleClick: 'effectDoubleClick',
  effectHeavyClick: 'effectHeavyClick',
  effectTick: 'effectTick'
}

const RNHapticFeedback = {
  trigger: jest.fn()
}

export { HapticFeedbackTypes }
export const trigger = RNHapticFeedback.trigger
export default RNHapticFeedback
