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
  ele: ChainablePromiseElement,
  targetText: string
) {
  const eleText = await ele.getText()
  assert.equal(eleText, targetText, `"${eleText}" !== "${targetText}"`)
}

async function waitFor(ele: ChainablePromiseElement, timeout = 20000) {
  await ele.waitForExist({ timeout })
}

async function waitForDisplayed(ele: ChainablePromiseElement, timeout = 20000) {
  await ele.waitForDisplayed({ timeout })
}

async function isVisible(ele: ChainablePromiseElement, targetBool = true) {
  const visible = await ele.isDisplayed()

  assert.equal(visible, targetBool, ele.toString())
  return visible
}

async function isVisibleTrueOrFalse(ele: ChainablePromiseElement) {
  return await ele.isDisplayed()
}

async function isSelected(ele: ChainablePromiseElement, targetBool = true) {
  const selected = await ele.isSelected()
  assert.equal(selected, targetBool, ele.toString())
  return selected
}

async function isEnabled(ele: ChainablePromiseElement, targetBool = true) {
  const enabled = await ele.isEnabled()
  assert.equal(enabled, targetBool, ele.toString())
  return enabled
}

async function tap(
  ele: ChainablePromiseElement | undefined,
  expectedEle?: ChainablePromiseElement
) {
  if (ele) {
    await waitFor(ele)
    await ele.waitForEnabled()
    await delay(1000)
    await ele.tap()
    const selector = await ele.selector
    console.log(`Tapped on selector: ${selector}`)
    if (expectedEle) {
      try {
        await waitFor(expectedEle)
      } catch (e) {
        await ele.tap()
        console.log(`Tapped again: ${selector}`)
      }
    }
  }
}

async function click(ele: ChainablePromiseElement) {
  await waitFor(ele)
  await ele.waitForEnabled()
  await ele.click()
  const selector = await ele.selector
  console.log(`Tapped on selector: ${selector}`)
}

async function dismissKeyboard(id = 'Return') {
  if (driver.isIOS) {
    await tap(selectors.getById(id))
  } else {
    await driver.hideKeyboard()
  }
  await delay(1000)
}

async function getText(ele: ChainablePromiseElement) {
  await waitFor(ele)
  return await ele.getText()
}

async function swipe(
  direction: string,
  percent: number,
  ele: ChainablePromiseElement
) {
  if (driver.isIOS) {
    await driver.execute('mobile: swipe', {
      direction: direction,
      percent: percent
    })
  } else {
    const elementId = await ele.elementId
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

async function clearText(ele: ChainablePromiseElement) {
  await ele.clearValue()
}

export const actions = {
  type,
  tapNumberPad,
  verifyElementText,
  waitFor,
  waitForDisplayed,
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
  isVisibleTrueOrFalse,
  clearText
}
