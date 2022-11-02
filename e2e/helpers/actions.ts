import { element, waitFor } from 'detox'

const tap = async (item: Detox.NativeMatcher) => {
  await element(item).tap()
}

const tapElementAtIndex = async (item: Detox.NativeMatcher, num: number) => {
  await element(item).atIndex(num).tap()
}

const longPress = async (item: Detox.NativeMatcher) => {
  await element(item).longPress()
}

const setColumnToValue = async (
  item: Detox.NativeMatcher,
  index: number,
  value: string
) => {
  await element(item).setColumnToValue(index, value)
}

const setInputText = async (item: Detox.NativeMatcher, value: string) => {
  await element(item).replaceText(value)
}

const waitForElement = async (item: Detox.NativeMatcher, timeout = 2000) => {
  await waitFor(element(item)).toBeVisible().withTimeout(timeout)
}

const getAttributes = async (item: Detox.NativeMatcher) => {
  return await element(item).getAttributes()
}

const swipeUp = async (
  item: Detox.NativeMatcher,
  speed: undefined,
  normalizedOffset: number
) => {
  return await element(item).swipe('up', speed, normalizedOffset)
}

const swipeDown = async (
  item: Detox.NativeMatcher,
  speed: undefined,
  normalizedOffset: number
) => {
  return await element(item).swipe('down', speed, normalizedOffset)
}

export default {
  tap,
  longPress,
  waitForElement,
  tapElementAtIndex,
  getAttributes,
  swipeUp,
  swipeDown,
  setColumnToValue,
  setInputText
}
