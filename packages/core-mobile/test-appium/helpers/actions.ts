/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ChainablePromiseElement } from 'webdriverio'
import { assert } from 'chai'
import { selectors } from './selectors'

async function type(element: ChainablePromiseElement, text: string | number) {
  await waitFor(element)
  await element.setValue('')
  await element.setValue(text)
}

// getText == targetText
async function verifyElementText(
  element: ChainablePromiseElement,
  targetText: string
) {
  const eleText = await element.getText()

  // chai 검증
  assert.equal(
    eleText,
    targetText,
    `"${eleText}"와 "${targetText}"는 같지 않습니다!`
  )
}

async function waitFor(element: ChainablePromiseElement, timeout = 5000) {
  await element.waitForDisplayed({ timeout })
}

async function isVisible(element: ChainablePromiseElement, targetBool = true) {
  const visible = await element.isDisplayed()

  // chai 검증
  assert.equal(visible, targetBool)
}

async function isVisibleTrueOrFalse(element: ChainablePromiseElement) {
  return await element.isDisplayed()
}

async function isSelected(element: ChainablePromiseElement, targetBool = true) {
  const selected = await element.isSelected()

  // chai 검증
  assert.equal(selected, targetBool)
}

async function isEnabled(element: ChainablePromiseElement, targetBool = true) {
  const enabled = await element.isEnabled() // true나 false 리턴할겁니다.

  // chai 검증
  assert.equal(enabled, targetBool)
}

async function tap(element: ChainablePromiseElement) {
  await element.click()
}

async function dismissKeyboard(text = 'Return') {
  if (driver.isIOS) {
    await tap(selectors.getByText(text))
  } else {
    await driver.hideKeyboard()
  }
}

async function getText(element: ChainablePromiseElement) {
  await waitFor(element)
  return await element.getText()
}

async function swipe(
  direction: string,
  percent: number,
  element: ChainablePromiseElement
) {
  if (driver.isIOS) {
    await driver.execute('mobile: swipe', {
      direction: direction,
      percent: percent
    })
  } else {
    const elementId = await element.elementId
    await driver.execute('mobile: swipeGesture', {
      elementId: elementId,
      direction: direction,
      percent: percent
    })
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function journalDate(date: number, month: number, year: number) {
  const targetDate = new Date()

  if (date) {
    targetDate.setDate(targetDate.getDate() - date)
  } else if (month) {
    targetDate.setMonth(targetDate.getMonth() - month)
  } else if (year) {
    targetDate.setFullYear(targetDate.getFullYear() - year)
  }
  return targetDate.toISOString().split('T')[0]
}

export const actions = {
  type,
  verifyElementText,
  waitFor,
  isVisible,
  isSelected,
  isEnabled,
  tap,
  dismissKeyboard,
  getText,
  swipe,
  delay,
  journalDate,
  isVisibleTrueOrFalse
}
