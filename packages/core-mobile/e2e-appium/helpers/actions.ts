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
      const iosPath = `-ios predicate string:label == "${char}" AND type == "XCUIElementTypeKey"`
      await selectors.getByXpath(iosPath).click()
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
  console.log(`[${eleSelector}] visible? TRUE ===`, visible)
  assert.equal(visible, true, `${eleSelector} is not visible`)
  return visible
}

async function isNotVisible(ele: ChainablePromiseElement) {
  const visible = await ele.isDisplayed()
  const eleSelector = await ele.selector
  console.log(`[${eleSelector}] NOT visible? FALSE ===`, visible)
  assert.equal(visible, false, `${eleSelector} is still visible`)
  return visible
}

async function waitForNotVisible(
  ele: ChainablePromiseElement,
  timeout = 20000
) {
  try {
    await ele.waitForDisplayed({ timeout, reverse: true })
  } catch (e) {
    await ele.waitForExist({ timeout, reverse: true })
  }
  const eleSelector = await ele.selector
  console.log(`[${eleSelector}] is not visible as expected`)
}

async function getVisible(ele: ChainablePromiseElement) {
  return (await ele.isDisplayed()) || (await ele.isExisting())
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

async function pasteText(inputElement: ChainablePromiseElement, text: string) {
  const encodedText = Buffer.from(text, 'utf-8').toString('base64')
  if (driver.isIOS) {
    await driver.setClipboard(encodedText)
  } else {
    await driver.setClipboard(encodedText, 'plaintext')
  }

  await waitFor(inputElement)
  await inputElement.longPress({
    x: 0,
    y: 0,
    duration: 600
  })

  if (driver.isIOS) {
    await click(selectors.getByText('Paste'))
  } else {
    await tapXY(160, 650)
  }

  await tapEnterOnKeyboard()
}

async function tapXY(x: number, y: number) {
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        { type: 'pointerUp', button: 0 }
      ]
    }
  ])
}

async function typeSlowly(
  element: ChainablePromiseElement,
  text: string | number
) {
  await waitFor(element)
  await element.clearValue()
  const textString = text.toString()
  for (const char of textString) {
    await delay(1)
    await element.addValue(char)
  }
}

async function assertPerformance(start: number, expectedTime = 10000) {
  const end = performance.now()
  const totalTime = end - start
  const passed = totalTime <= expectedTime
  console.log(
    `${passed ? 'PASSED' : 'FAILED'} | ${totalTime.toFixed(
      0
    )}ms (limit: ${expectedTime}ms)`
  )
  assert.equal(
    passed,
    true,
    `Performed within ${expectedTime}ms: ${totalTime.toFixed(0)}ms`
  )
}

async function isNativeAlertPresent(): Promise<boolean> {
  try {
    await driver.getAlertText()
    console.log('Native alert is present')
    return true
  } catch (e) {
    console.log('No native alert present')
    return false
  }
}

export const actions = {
  type,
  typeSlowly,
  pasteText,
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
  verifyText,
  tapXY,
  waitForNotVisible,
  assertPerformance,
  isNativeAlertPresent
}
