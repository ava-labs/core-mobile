/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint max-params: ["error", 4]*/

import assert from 'assert'
import { element, waitFor } from 'detox'
import { Platform } from './constants'
import Constants from './constants'
import delay from './waits'
const fs = require('fs')

const balanceToNumber = async (balance: Detox.NativeMatcher, index = 0) => {
  //currently works only with android
  const availableBalance: any = await getAttributes(balance, index)
  return parseFloat(await availableBalance.text.match(/[\d.]+/)[0])
}

const tap = async (item: Detox.NativeMatcher, enableSync = false) => {
  await waitForElement(item)
  if (enableSync) {
    // some tests are not working with the desync mode, so we need to enable it
    await device.enableSynchronization()
  }
  await element(item).tap()
}

const waitAndTap = async (
  item: Detox.NativeMatcher,
  timeout = 1000,
  enableSync = false
) => {
  await delay(timeout)
  await tap(item, enableSync)
}

const tapAtXAndY = async (
  item: Detox.NativeMatcher,
  xOffset = 0,
  yOffset = 0
) => {
  await waitForElement(item)
  await element(item).tap({ x: xOffset, y: yOffset })
}

const multiTap = async (
  item: Detox.NativeMatcher,
  count: number,
  index: number
) => {
  await waitForElement(item, 10000, index)
  await element(item).atIndex(index).multiTap(count)
}

const tapElementAtIndex = async (
  item: Detox.NativeMatcher,
  num: number,
  timeout = 10000
) => {
  await waitForElement(item, timeout, num)
  await element(item).atIndex(num).tap()
}

const longPress = async (item: Detox.NativeMatcher, duration = 100) => {
  await waitForElement(item)
  await element(item).longPress(duration)
  await delay(1000)
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
    await waitForElement(item)
    await element(item).replaceText(value)
  } else {
    await waitForElement(item, 10000, index)
    await element(item).atIndex(index).replaceText(value)
  }
}

const dismissKeyboard = async (searchBarId = 'search_bar') => {
  if (platform() === Platform.iOS) {
    try {
      await element(by.id(searchBarId)).tapReturnKey()
    } catch (e) {
      await element(by.label('done')).atIndex(0).tap()
    }
  } else {
    await device.pressBack()
  }
}

// sunsetting this method because it's not working for the reuse state
// const waitForElement = async (
//   item: Detox.NativeMatcher,
//   timeout = 5000,
//   index = 0
// ) => {
//   await waitFor(element(item).atIndex(index)).toBeVisible().withTimeout(timeout)
// }

const waitForElement = async (
  item: Detox.NativeMatcher,
  timeout = 10000,
  index = 0
) => {
  const startTime = Date.now()
  await device.disableSynchronization()
  while (Date.now() - startTime < timeout) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      await waitFor(element(item).atIndex(index)).toBeVisible().withTimeout(500)
      return
    } catch (error: any) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  console.error(
    `Element not visible within timeout: matcher=${JSON.stringify(
      item
    )} index=${index}`
  )
  throw new Error(
    `Element not visible within timeout: matcher=${JSON.stringify(
      item
    )} index=${index}`
  )
}

const failIfElementAppearsWithin = async (
  item: Detox.NativeMatcher,
  timeout = 5000,
  index = 0
): Promise<void> => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      await waitFor(element(item).atIndex(index)).toBeVisible().withTimeout(500)
      // if the element is visible, throw an error
      throw new Error('Element became visible before timeout')
    } catch (e: any) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

const waitForElementNotVisible = async (
  item: Detox.NativeMatcher,
  timeout = 5000,
  index = 0
) => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      await waitFor(element(item).atIndex(index))
        .not.toBeVisible()
        .withTimeout(500)
      return
    } catch (error: any) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  console.error('Error: Element visible within timeout')
  throw new Error('Element visible within timeout')
}

const getRandomEle = (items: any[]): any => {
  return items[Math.floor(Math.random() * items.length)]
}

const getRandomIndex = (itemsLength: number): number => {
  return Math.floor(Math.random() * itemsLength)
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

const getElementText = async (
  item: Detox.NativeMatcher,
  timeout = 2000,
  index = 0
) => {
  await waitForElement(item, timeout, index)
  const startTime = Date.now()
  const endTime = startTime + timeout
  while (Date.now() < endTime) {
    try {
      await waitFor(element(item)).toBeVisible().withTimeout(timeout)
      const eleAttr = await element(item).getAttributes()
      console.log('elements attributes: ', eleAttr)
      if (!('elements' in eleAttr)) {
        return eleAttr.text
      } else if (eleAttr.elements[index]) return eleAttr.elements[index].text
    } catch (error: any) {
      if (error.message === Constants.idleTimeoutError) {
        console.error(Constants.animatedConsoleError)
      }
    }
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

const isVisible = async (
  item: Detox.NativeMatcher,
  index = 0,
  timeout = 10000
) => {
  try {
    await waitForElement(item, timeout, index)
    return true
  } catch (e) {
    console.log('Element is not visible ' + e)
    return false
  }
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

const swipe = async (
  item: Detox.NativeMatcher,
  direction: Detox.Direction,
  speed: Detox.Speed = 'slow',
  offset = 0.25,
  index = 0
  // eslint-disable-next-line max-params
) => {
  await element(item).atIndex(index).swipe(direction, speed, offset)
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

const scrollToBottom = async (scrollView: Detox.NativeMatcher) => {
  await waitForElement(scrollView)
  await detox.element(scrollView).scrollTo('bottom')
}

const scrollToTop = async (scrollView: Detox.NativeMatcher) => {
  await waitForElement(scrollView)
  await detox.element(scrollView).scrollTo('top')
}

const scrollListUntil = async (
  scrollToItem: Detox.NativeMatcher,
  scrollList: Detox.NativeMatcher,
  scrollPixel: number,
  direction: Detox.Direction = 'down'
) => {
  await waitForElement(scrollList)
  await waitFor(element(scrollToItem))
    .toBeVisible()
    .whileElement(scrollList)
    .scroll(scrollPixel, direction)
}

async function writeQrCodeToFile(clipboardValue: string) {
  fs.writeFile(
    './e2e/tests/dapps/playwright/qr_codes.txt',
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

const drag = async (
  item: Detox.NativeMatcher,
  direction: Detox.Direction = 'down',
  percentage = 0.2,
  index = 0
) => {
  await waitForElement(item, 10000, index)
  await element(item).atIndex(index).longPress()
  await element(item).atIndex(index).swipe(direction, 'fast', percentage)
}

const dragTo = async (
  fromEle: Detox.NativeMatcher,
  targetEle: Detox.NativeMatcher,
  targetOffset: [number, number] // [targetOffsetX, targetOffsetY]
) => {
  await element(fromEle).longPressAndDrag(
    500,
    NaN,
    NaN,
    element(targetEle),
    targetOffset[0],
    targetOffset[1],
    'fast',
    0
  )
}

const getAmount = (amount: string | undefined): number => {
  if (amount) {
    return parseFloat(amount.replace(/\$/g, '').replace(/,/g, ''))
  } else return 0
}

const isWithinTolerance = (
  baseValue: number,
  targetValue: number,
  tolerance: number
) => {
  const result =
    Math.abs(baseValue - Math.abs(targetValue)) <= baseValue * (tolerance / 100)
  console.log(
    `baseValue: ${baseValue}, targetValue: ${targetValue}, result: ${result}`
  )
  return result
}

const shuffleArray = <T>(array: T[]): T[] =>
  array.sort(() => Math.random() - 0.5)

export default {
  balanceToNumber,
  tap,
  tapAtXAndY,
  multiTap,
  longPress,
  waitForElement,
  waitForElementNotVisible,
  failIfElementAppearsWithin,
  waitForCondition,
  tapElementAtIndex,
  getAttributes,
  swipeUp,
  swipeDown,
  swipeLeft,
  swipe,
  setColumnToValue,
  setInputText,
  platform,
  isVisible,
  getCurrentDateTime,
  writeQrCodeToFile,
  scrollListUntil,
  getElementsByTestId,
  getElementsTextByTestId,
  dismissKeyboard,
  getElementText,
  clearTextInput,
  drag,
  dragTo,
  shuffleArray,
  scrollToBottom,
  scrollToTop,
  getAmount,
  getRandomEle,
  getRandomIndex,
  isWithinTolerance,
  waitAndTap
}
