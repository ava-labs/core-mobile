import { element, waitFor } from 'detox'

const tap = async item => {
  await element(item).tap()
}

const tapElementAtIndex = async (item, num) => {
  await element(item).atIndex(num).tap()
}

const longPress = async item => {
  await element(item).longPress()
}

const setColumnToValue = async (item, index, value) => {
  await element(item).setColumnToValue(index, value)
}

const setInputText = async (item, value) => {
  await element(item).replaceText(value)
}

const waitForElement = async (item, timeout = 2000) => {
  await waitFor(element(item)).toBeVisible(item).withTimeout(timeout)
}

const getAttributes = async item => {
  return await element(item).getAttributes()
}

const swipeUp = async (item, speed, normalizedOffset) => {
  return await element(item).swipe('up', speed, normalizedOffset)
}

const swipeDown = async (item, speed, normalizedOffset) => {
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
