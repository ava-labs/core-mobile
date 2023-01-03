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

const setInputText = async (
  item: Detox.NativeMatcher,
  value: string,
  index?: number
) => {
  if (index === undefined) {
    await element(item).replaceText(value)
  } else {
    await element(item).atIndex(index).replaceText(value)
  }
}

const waitForElement = async (item: Detox.NativeMatcher, timeout = 2000) => {
  await waitFor(element(item)).toBeVisible().withTimeout(timeout)
}

const waitForElementNotVisible = async (
  item: Detox.NativeMatcher,
  timeout = 20000
) => {
  await waitFor(element(item)).not.toBeVisible().withTimeout(timeout)
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
  normalizedOffset: number,
  index: 0
) => {
  return await element(item)
    .atIndex(index)
    .swipe('down', speed, normalizedOffset)
}

export default {
  tap,
  longPress,
  waitForElement,
  waitForElementNotVisible,
  tapElementAtIndex,
  getAttributes,
  swipeUp,
  swipeDown,
  setColumnToValue,
  setInputText
}
