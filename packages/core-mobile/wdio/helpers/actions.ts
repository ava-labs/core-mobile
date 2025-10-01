import assert from 'assert'
import { ChainablePromiseElement } from 'webdriverio'
import { selectors } from './selectors'

async function type(element: ChainablePromiseElement, text: string | number) {
  await waitFor(element)
  await element.clearValue()
  await element.addValue(text)
}

async function tapNumberPad(keyCode: string) {
  for (const char of keyCode.split('')) {
    if (driver.isIOS) {
      await selectors
        .getByXpath(
          `//*[contains(@name, 'UIKeyboardLayoutStar')]//*[@name='${char}']`
        )
        .click()
    } else {
      const num = 7 + parseInt(char, 10)
      await driver.pressKeyCode(num)
    }
  }
}

// getText == targetText
async function verifyElementText(
  element: ChainablePromiseElement,
  targetText: string
) {
  const eleText = await element.getText()
  assert.equal(eleText, targetText, `"${eleText}" !== "${targetText}"`)
}

async function waitFor(element: ChainablePromiseElement, timeout = 20000) {
  await element.waitForDisplayed({ timeout })
}

async function isVisible(element: ChainablePromiseElement, targetBool = true) {
  const visible = await element.isDisplayed()

  assert.equal(visible, targetBool, element.toString())
  return visible
}

async function isVisibleTrueOrFalse(element: ChainablePromiseElement) {
  return await element.isDisplayed()
}

async function isSelected(element: ChainablePromiseElement, targetBool = true) {
  const selected = await element.isSelected()
  assert.equal(selected, targetBool, element.toString())
  return selected
}

async function isEnabled(element: ChainablePromiseElement, targetBool = true) {
  const enabled = await element.isEnabled()
  assert.equal(enabled, targetBool, element.toString())
  return enabled
}

async function tap(element: ChainablePromiseElement) {
  await waitFor(element)
  await element.waitForEnabled()
  await element.tap()
}

async function click(element: ChainablePromiseElement) {
  await waitFor(element)
  await element.waitForEnabled()
  await element.click()
}

async function dismissKeyboard(id = 'Return') {
  if (driver.isIOS) {
    await tap(selectors.getById(id))
  } else {
    await driver.hideKeyboard()
  }
  console.log('keyboard is dismissed')
  await delay(1000)
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

async function dragAndDrop(
  ele: ChainablePromiseElement,
  targetOffset: [number, number],
  duration = 500
) {
  await ele.dragAndDrop(
    {
      x: targetOffset[0],
      y: targetOffset[1]
    },
    { duration }
  )
}

export const actions = {
  type,
  tapNumberPad,
  verifyElementText,
  waitFor,
  isVisible,
  isSelected,
  isEnabled,
  tap,
  click,
  dismissKeyboard,
  getText,
  swipe,
  dragAndDrop,
  delay,
  isVisibleTrueOrFalse
}
