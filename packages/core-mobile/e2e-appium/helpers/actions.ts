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
  const eleSelector = await ele.selector
  assert.equal(
    eleText,
    targetText,
    `${eleSelector} text is "${eleText}" !== "${targetText}"`
  )
}

async function waitFor(ele: ChainablePromiseElement, timeout = 20000) {
  try {
    await ele.waitForExist({ timeout })
  } catch (e) {
    await ele.waitForDisplayed({ timeout })
  }
}

async function waitForDisplayed(ele: ChainablePromiseElement, timeout = 20000) {
  await ele.waitForDisplayed({ timeout })
}

async function isVisible(ele: ChainablePromiseElement) {
  const visible = await ele.isDisplayed()
  const eleSelector = await ele.selector
  console.log(`${eleSelector} isVisible? `, visible)
  assert.equal(visible, true, `${eleSelector} is not visible`)
  return visible
}

async function isNotVisible(ele: ChainablePromiseElement) {
  const visible = await ele.isDisplayed()
  const eleSelector = await ele.selector
  console.log(`${eleSelector} isVisible? `, visible)
  assert.equal(visible, false, `${eleSelector} is still visible`)
  return visible
}

async function getVisible(ele: ChainablePromiseElement) {
  return await ele.isDisplayed()
}

async function isSelected(ele: ChainablePromiseElement, targetBool = true) {
  const selected = await ele.isSelected()
  const eleSelector = await ele.selector
  assert.equal(
    selected,
    targetBool,
    `${eleSelector} is ${targetBool ? 'selected' : 'not selected'}`
  )
  return selected
}

async function isEnabled(ele: ChainablePromiseElement, targetBool = true) {
  const enabled = await ele.isEnabled()
  const eleSelector = await ele.selector
  console.log(`${eleSelector} isEnabled? `, enabled)
  assert.equal(
    enabled,
    targetBool,
    `${eleSelector} is ${targetBool ? 'enabled' : 'disabled'}`
  )
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
    console.log(`Tapped "${selector}"`)
    if (expectedEle) {
      try {
        await waitFor(expectedEle)
      } catch (e) {
        if (await getVisible(ele)) {
          await ele.tap()
          console.log(`Tapped again "${selector}"`)
        } else {
          console.log(`Skipping tap on "${selector}" because it is not visible`)
        }
      }
    }
  }
}

async function longPress(
  ele: ChainablePromiseElement | undefined,
  expectedEle?: ChainablePromiseElement
) {
  if (ele) {
    await waitFor(ele)
    await ele.waitForEnabled()
    await delay(1000)
    await ele.longPress()
    const selector = await ele.selector
    console.log(`longPress "${selector}"`)
    if (expectedEle) {
      try {
        await waitFor(expectedEle)
      } catch (e) {
        await ele.longPress()
        console.log(`longPress again "${selector}"`)
      }
    }
  }
}

async function click(ele: ChainablePromiseElement) {
  await waitFor(ele)
  await ele.waitForEnabled()
  await ele.click()
  const selector = await ele.selector
  console.log(`Clicked ${selector}`)
}

async function dismissKeyboard(id = 'Return') {
  if (driver.isIOS) {
    await tap(selectors.getById(id))
  } else {
    await driver.hideKeyboard()
  }
  await delay(1000)
}

async function tapEnterOnKeyboard(id = 'Return') {
  if (driver.isIOS) {
    await click(selectors.getById(id))
  } else {
    await driver.pressKeyCode(66)
  }
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
  await waitFor(ele)
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

const getAmount = (amount: string | undefined): number => {
  if (amount) {
    return parseFloat(amount.replace(/\$/g, '').replace(/,/g, ''))
  } else return 0
}

async function clearText(ele: ChainablePromiseElement) {
  await ele.clearValue()
}

async function scrollTo(
  ele: ChainablePromiseElement
  // direction: 'down' | 'up' | 'left' | 'right' = 'down'
) {
  await ele.scrollIntoView()
}

async function log() {
  const src = await driver.getPageSource()
  console.log('Printing page source...')
  console.log(src)
  console.log('...done')
}

async function verifyText(text: string, ele: ChainablePromiseElement) {
  const eleText = await ele.getText()
  const eleSelector = await ele.selector
  assert.equal(
    eleText,
    text,
    `${eleSelector} text is "${eleText}" !== "${text}"`
  )
}

export const actions = {
  type,
  tapNumberPad,
  verifyElementText,
  waitFor,
  waitForDisplayed,
  isVisible,
  isNotVisible,
  isSelected,
  isEnabled,
  tap,
  longPress,
  click,
  dismissKeyboard,
  tapEnterOnKeyboard,
  getText,
  swipe,
  dragAndDrop,
  delay,
  getVisible,
  clearText,
  scrollTo,
  log,
  getAmount,
  verifyText
}
