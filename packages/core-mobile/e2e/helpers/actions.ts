/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { element, waitFor } from 'detox'
import { Page } from '@playwright/test'
import { Platform } from './constants'
import Constants from './constants'
const fs = require('fs')

async function createFileIfNotExist(path: string) {
  fs.writeFile(path, '', { flag: 'wx' }, function (err: string) {
    if (err) throw err
    return path
  })
}

const reportUIPerformanceFilePath = createFileIfNotExist(
  './e2e/tests/performance/testResults/allResults.txt'
)

const tempUIPerformanceFilePath = createFileIfNotExist('./e2e/tests/performance/testResults/tempResults.txt')

const balanceToNumber = async (balance: Detox.NativeMatcher, index = 0) => {
  //currently works only with android
  const availableBalance: any = await getAttributes(balance, index)
  return parseFloat(await availableBalance.text.match(/[\d.]+/)[0])
}

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

const waitForElement = async (
  item: Detox.NativeMatcher,
  timeout = 2000,
  index = 0
) => {
  await waitFor(element(item).atIndex(index)).toBeVisible().withTimeout(timeout)
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

const reportUIPerformance = async (
  startTime: number,
  endTime: number,
  testName: string,
  androidMaxTime: number,
  iOSMaxTime: number
) => {
  let resultPlatform
  let maxTime

  if (platform() === Platform.Android) {
    resultPlatform = 'Android'
    maxTime = androidMaxTime
  } else {
    resultPlatform = 'iOS'
    maxTime = iOSMaxTime
  }

  const time = (endTime - startTime) / 1000

  const status = time > maxTime ? 'fail' : 'pass'

  const currentDateTime = getCurrentDateTime()
  const newValue = `${time
    .toFixed(3)
    .toString()}  ${resultPlatform}  ${testName}  ${status}  ${currentDateTime}\n`

  let data = ''

  try {
    data = fs.readFileSync(reportUIPerformanceFilePath, 'utf8')
  } catch (err) {
    console.error('Error reading file:', err)
    // continue
  }

  const existingLines = data.trim().split('\n')

  const updatedContent = existingLines.concat(newValue).join('\n')

  try {
    fs.writeFileSync(reportUIPerformanceFilePath, updatedContent, 'utf8')
    console.log('Value appended to file:', newValue)
  } catch (err) {
    console.error('Error writing file:', err)
  }

  console.log('Results saved to file.')
}

const saveTempUIPerformance = async (startTime: number, endTime: number) => {
  const result = ((endTime - startTime) / 1000).toString()
  fs.writeFile(tempUIPerformanceFilePath, result, (err: any) => {
    if (err) throw err
  })
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

export default {
  balanceToNumber,
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
  openPage,
  platform,
  isVisible,
  getCurrentDateTime,
  reportUIPerformance,
  saveTempUIPerformance,
  writeQrCodeToFile
}
