/* eslint-disable @typescript-eslint/no-explicit-any */

import { element, waitFor } from 'detox'
import { Platform } from './constants'
import Constants from './constants'

const tap = async (item: Detox.NativeMatcher) => {
  await element(item).tap()
}

const tapElementAtIndex = async (item: Detox.NativeMatcher, num: number) => {
  await element(item).atIndex(num).tap()
}

// tapElementAtIndexNoSync function can be used to handle idle timeout error for Android devices, should be used only if Idle timeout error presents
const tapElementAtIndexNoSync = async (
  item: Detox.NativeMatcher,
  num: number
) => {
  if (platform() === Platform.Android) {
    try {
      await element(item).atIndex(num).tap()
    } catch (error: any) {
      if (error.message === Constants.idleTimeoutError) {
        console.error(Constants.animatedConsoleError)
      } else {
        throw error
      }
    }
  } else {
    await element(item).atIndex(num).tap()
  }
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

// waitForElementNoSync function can be used to handle idle timeout error for Android devices, should be used only if Idle timeout error presents

const waitForElementNoSync = async (
  item: Detox.NativeMatcher,
  timeout = 2000
) => {
  if (platform() === Platform.Android) {
    const startTime = Date.now()
    const endTime = startTime + timeout

    while (Date.now() < endTime) {
      try {
        await waitFor(element(item)).toBeVisible().withTimeout(timeout)
        return
      } catch (error: any) {
        if (error.message === Constants.idleTimeoutError) {
          console.error(Constants.animatedConsoleError)
        } else {
          throw error
        }
      }
    }

    console.error('Error: Element not visible within timeout')
    throw new Error('Element not visible within timeout')
  } else {
    await waitFor(element(item)).toBeVisible().withTimeout(timeout)
  }
}

const waitForElementNotVisible = async (
  item: Detox.NativeMatcher,
  timeout = 20000
) => {
  await waitFor(element(item)).not.toBeVisible().withTimeout(timeout)
}

const getAttributes = async (item: any, index = 0) => {
  return await element(item).atIndex(index).getAttributes()
}

// Not working for some reason, need to fix
const getAndroidAttributesArray = async (
  locator: Detox.NativeMatcher,
  loopCount: number
) => {
  const attsArray = []
  for (let i = 0; i < loopCount; i++) {
    const el = element(locator).atIndex(i)
    const atts = await el.getAttributes()
    attsArray.push(atts)
  }
  console.log(JSON.stringify(attsArray))
  return attsArray
}

const isVisible = async (
  item: Detox.NativeMatcher,
  index: number
): Promise<boolean> => {
  const result = await waitFor(element(item).atIndex(index))
    .toBeVisible()
    .withTimeout(2000)
    .then(() => true)
    .catch(() => false)
  return result
}

const swipeUp = async (
  item: Detox.NativeMatcher,
  speed: Detox.Speed,
  normalizedOffset: number,
  index: number
) => {
  return await element(item).atIndex(index).swipe('up', speed, normalizedOffset)
}

const swipeDown = async (
  item: Detox.NativeMatcher,
  speed: Detox.Speed,
  normalizedOffset: number,
  index: 0
) => {
  return await element(item)
    .atIndex(index)
    .swipe('down', speed, normalizedOffset)
}

const swipeLeft = async (
  item: Detox.NativeMatcher,
  speed: Detox.Speed,
  normalizedOffset: number,
  index: number
) => {
  return await element(item)
    .atIndex(index)
    .swipe('left', speed, normalizedOffset)
}

const platform = () => {
  return device.getPlatform()
}

export default {
  tap,
  longPress,
  waitForElement,
  waitForElementNoSync,
  waitForElementNotVisible,
  tapElementAtIndex,
  tapElementAtIndexNoSync,
  getAttributes,
  swipeUp,
  swipeDown,
  swipeLeft,
  setColumnToValue,
  setInputText,
  getAndroidAttributesArray,
  platform,
  isVisible
}
