/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint max-params: ["error", 4]*/

import assert from 'assert'
import { element, waitFor } from 'detox'
import { Page } from '@playwright/test'
import { Platform } from './constants'
import Constants from './constants'
const fs = require('fs')

const balanceToNumber = async (balance: Detox.NativeMatcher, index = 0) => {
  //currently works only with android
  const availableBalance: any = await getAttributes(balance, index)
  return parseFloat(await availableBalance.text.match(/[\d.]+/)[0])
}

const tap = async (item: Detox.NativeMatcher) => {
  await element(item).tap()
}

const multiTap = async (
  item: Detox.NativeMatcher,
  count: number,
  index: number
) => {
  await element(item).atIndex(index).multiTap(count)
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

const dismissKeyboard = async (searchBarId = 'search_bar__search') => {
  if (platform() === Platform.iOS) {
    await element(by.id(searchBarId)).tapReturnKey()
  } else {
    await device.pressBack()
  }
}

const waitForElement = async (
  item: Detox.NativeMatcher,
  timeout = 2000,
  index = 0
) => {
  await waitFor(element(item).atIndex(index)).toBeVisible().withTimeout(timeout)
}

const expectToBeVisible = async (item: Detox.NativeMatcher, index = 0) => {
  try {
    await waitFor(element(item).atIndex(index)).toBeVisible().withTimeout(1000)
    return true
  } catch (e) {
    console.log('Element is not visible ' + e)
    return false
  }
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
  timeout = 20000,
  index = 0
) => {
  await waitFor(element(item).atIndex(index))
    .not.toBeVisible()
    .withTimeout(timeout)
}

const getAttributes = async (item: any, index = 0) => {
  return await element(item).atIndex(index).getAttributes()
}

const getElementsTextByTestId = async (testID: string): Promise<string[]> => {
  const output: string[] = []
  const elements = await getElementsByTestId(testID)
  for (const ele of elements) {
    const curr = await ele.getAttributes()
    if (!('elements' in curr) && curr.text) output.push(curr.text)
  }
  console.log(output)
  return output
}

const getElementText = async (ele: Detox.NativeMatcher, index = 0) => {
  try {
    const eleAttr = await element(ele).getAttributes()
    if (!('elements' in eleAttr)) {
      return eleAttr.text
    } else if (eleAttr.elements[index]) return eleAttr.elements[index].text
  } catch (e) {
    console.error('Failed to get element text:', e)
  }
  return ''
}

const getElementsByTestId = async (testID: string) => {
  // Query for the first element with the given testID
  const elements: Detox.NativeElement[] = []
  let elementFound = await isVisible(by.id(testID), 0)
  // Continue looping until no more elements are found
  while (elementFound) {
    // Add the found element to the array
    elements.push(element(by.id(testID)).atIndex(elements.length))
    // Try to find the next element with the same testID
    elementFound = await isVisible(by.id(testID), elements.length)
    // await element(by.id(testID)).atIndex(elements.length).scrollTo('top')
  }
  return elements
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
  return await waitFor(element(item).atIndex(index))
    .toBeVisible()
    .withTimeout(2000)
    .then(() => true)
    .catch(() => false)
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

const openPage = async (page: Page, url: string) => {
  await page.goto(url)
}

const platform = () => {
  return device.getPlatform()
}

const getCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds}`
}

const scrollListUntil = async (
  scrollToItem: Detox.NativeMatcher,
  scrollList: Detox.NativeMatcher,
  scrollPixel: number,
  direction: Detox.Direction = 'down'
) => {
  await waitFor(element(scrollToItem))
    .toBeVisible()
    .whileElement(scrollList)
    .scroll(scrollPixel, direction)
}

async function writeQrCodeToFile(clipboardValue: string) {
  fs.writeFile(
    './e2e/tests/playwright/qr_codes.txt',
    clipboardValue,
    (err: any) => {
      if (err) throw err
    }
  )
}

const clearTextInput = async (item: Detox.NativeMatcher, index = 0) => {
  await element(item).atIndex(index).clearText()
}

async function waitForCondition(func: any, condition: any, timeout = 5000) {
  let isFulfilled = false

  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      if (condition(await func())) {
        isFulfilled = true
        break
      }
    } catch (error) {
      console.error(`Error in waitForCondition: ${error}`)
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert(isFulfilled)
}

export default {
  balanceToNumber,
  tap,
  multiTap,
  longPress,
  waitForElement,
  waitForElementNoSync,
  waitForElementNotVisible,
  waitForCondition,
  tapElementAtIndex,
  tapElementAtIndexNoSync,
  getAttributes,
  swipeUp,
  swipeDown,
  swipeLeft,
  setColumnToValue,
  setInputText,
  getAndroidAttributesArray,
  openPage,
  platform,
  isVisible,
  getCurrentDateTime,
  writeQrCodeToFile,
  expectToBeVisible,
  scrollListUntil,
  getElementsByTestId,
  getElementsTextByTestId,
  dismissKeyboard,
  getElementText,
  clearTextInput
}
