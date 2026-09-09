import assert from 'assert'
import { ChainablePromiseElement } from 'webdriverio'
import { selectors } from './selectors'

/**
 * First fulfillment wins; rejects only if both reject (Promise.any semantics for two promises).
 * Avoids Promise.race + side .catch: the loser can still reject later and confuse loggers.
 */
function firstFulfillment<T>(a: Promise<T>, b: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false
    let rejectCount = 0
    let firstError: unknown

    const onFulfill = (v: T) => {
      if (done) return
      done = true
      resolve(v)
    }
    const onReject = (err: unknown) => {
      if (done) return
      if (rejectCount === 0) {
        firstError = err
      }
      rejectCount += 1
      if (rejectCount === 2) {
        done = true
        reject(firstError)
      }
    }

    a.then(onFulfill).catch(onReject)
    b.then(onFulfill).catch(onReject)
  })
}

async function type(element: ChainablePromiseElement, text: string | number) {
  // Validate input
  if (text === undefined || text === null) {
    throw new Error(`Cannot type undefined or null value. Received: ${text}`)
  }

  const textToType = String(text)
  if (textToType.length === 0) {
    console.log('Warning: Attempting to type empty string')
  }

  await waitFor(element)

  // Ensure the element is focused before typing (both platforms)
  // This is especially important for TextInputs that have children components
  try {
    // Click the element to focus it
    await element.click()
    await driver.pause(500) // Wait for focus and keyboard
  } catch {
    console.log(
      'Warning: Could not click element before typing, continuing anyway'
    )
  }

  // Clear any existing value
  try {
    await element.clearValue()
    await driver.pause(200)
  } catch {
    // If clearValue fails, try selecting all and deleting
    if (driver.isAndroid) {
      try {
        // 29 = KEYCODE_A, 4096 = META_CTRL_ON (Ctrl+A = select all)
        await driver.pressKeyCode(29, 4096)
        await driver.pause(100)
        await driver.pressKeyCode(67) // Delete
        await driver.pause(200)
      } catch {
        // Continue anyway
      }
    }
  }

  // Use setValue for both platforms since we've already cleared the value
  // setValue is more reliable for TextInputs with children components
  await element.setValue(textToType)

  // Small pause to ensure text is processed
  await driver.pause(300)
}

async function tapNumberPad(keyCode: string) {
  for (const char of keyCode.split('')) {
    if (driver.isIOS) {
      const iosPath = `-ios predicate string:label == "${char}" AND type == "XCUIElementTypeKey"`
      await selectors.getByXpath(iosPath).click()
    } else {
      await driver.execute('mobile: type', { text: char })
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
    await firstFulfillment(
      ele.waitForExist({ timeout }),
      ele.waitForDisplayed({ timeout })
    )
  } catch {
    await ele.waitForDisplayed({ timeout })
    return
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
  await firstFulfillment(
    ele.waitForDisplayed({ timeout, reverse: true }),
    ele.waitForExist({ timeout, reverse: true })
  )
  const eleSelector = await ele.selector
  console.log(`[${eleSelector}] is not visible as expected`)
}

async function getVisible(ele: ChainablePromiseElement) {
  return (await ele.isDisplayed()) || (await ele.isExisting())
}

/**
 * Check if element is visible within timeout.
 * Waits up to `timeout` ms using WebdriverIO's display polling; returns false on timeout or error.
 */
async function isElementVisible(
  element: ChainablePromiseElement,
  timeout = 2000
): Promise<boolean> {
  try {
    await element.waitForDisplayed({ timeout })
    return await element.isDisplayed()
  } catch {
    return false
  }
}

/**
 * Check if biometric toggle is ON (visible “on” testID within timeout).
 */
async function isBiometricToggleOn(timeout = 1500): Promise<boolean> {
  const toggleOn = selectors.getById('toggle_biometrics_on')
  return isElementVisible(toggleOn, timeout)
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
    await ele.click()
    const selector = await ele.selector
    console.log(`Tapped "${selector}"`)
    if (expectedEle) {
      try {
        await waitFor(expectedEle)
      } catch {
        if (await getVisible(ele)) {
          await ele.click()
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
      } catch {
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
    try {
      await click(selectors.getById(id))
    } catch {
      await click(selectors.getById('Done'))
    }
  } else {
    await driver.hideKeyboard()
  }
  await delay(1000)
}

async function tapEnterOnKeyboard(id = 'Return') {
  if (driver.isIOS) {
    try {
      await click(selectors.getById(id))
    } catch {
      await click(selectors.getById('Done'))
    }
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
    const { width, height } = await driver.getWindowSize()
    await driver.execute('mobile: swipeGesture', {
      left: 0,
      top: Math.floor(height * 0.2),
      width,
      height: Math.floor(height * 0.6),
      direction: direction,
      percent: percent
    })
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Drags an element by the specified offset.
 *
 * Scroll direction guide (based on finger gesture):
 * - Negative y offset [0, -200]: Drag UP → Scroll DOWN (reveals content below)
 * - Positive y offset [0, 200]: Drag DOWN → Scroll UP (reveals content above)
 *
 * @param ele - The element to drag
 * @param targetOffset - [x, y] offset from current position
 * @param duration - Duration of the drag gesture in ms (default: 500)
 */
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
  ele: ChainablePromiseElement,
  direction = 'down',
  amount = 0.1
) {
  const { width, height } = await driver.getWindowSize()
  for (let i = 0; i < 10; i++) {
    if (await ele.isDisplayed().catch(() => false)) return
    if (driver.isIOS) {
      // iOS `mobile: swipe` direction = finger direction (opposite of scroll direction)
      // 'down' scroll intent → finger moves 'up', and vice versa
      const iosDirection = direction === 'down' ? 'up' : 'down'
      await driver.execute('mobile: swipe', {
        direction: iosDirection,
        percent: amount
      })
    } else {
      await driver.execute('mobile: scrollGesture', {
        left: 0,
        top: Math.floor(height * 0.2),
        width,
        height: Math.floor(height * 0.4),
        direction,
        percent: 0.3
      })
    }
  }
  await waitFor(ele)
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

async function pasteText(
  inputElement: ChainablePromiseElement,
  text: string,
  keyboardId = 'Return'
) {
  await waitFor(inputElement)

  if (driver.isIOS) {
    const encodedText = Buffer.from(text, 'utf-8').toString('base64')
    await driver.setClipboard(encodedText)
    await inputElement.longPress({ x: 0, y: 0, duration: 600 })
    await click(selectors.getByText('Paste'))
  } else {
    await type(inputElement, text)
  }
  try {
    await tapEnterOnKeyboard(keyboardId)
  } catch {
    console.log('Warning: Could not tap Enter on keyboard, continuing anyway')
  }
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
  // Validate input
  if (text === undefined || text === null) {
    throw new Error(
      `Cannot typeSlowly undefined or null value. Received: ${text}`
    )
  }

  const textToType = String(text)
  if (textToType.length === 0) {
    console.log('Warning: Attempting to typeSlowly empty string')
  }

  await waitFor(element)

  // Ensure the element is focused before typing (both platforms)
  // This is especially important for TextInputs that have children components
  try {
    // Click the element to focus it
    await element.click()
    await driver.pause(500) // Wait for focus and keyboard
  } catch {
    console.log(
      'Warning: Could not click element before typeSlowly, continuing anyway'
    )
  }

  // Clear any existing value
  try {
    await element.clearValue()
    await driver.pause(200)
  } catch {
    // Continue anyway
  }

  if (driver.isAndroid) {
    await driver.execute('mobile: type', { text: textToType })
    await driver.pause(200)
    return
  }

  // Character-by-character input so PIN fields / masked inputs get per-keystroke events (setValue alone can skip that).
  const perCharMs = 55
  for (const char of textToType) {
    await element.addValue(char)
    await driver.pause(perCharMs)
  }
  await driver.pause(200)
}

async function assertPerformance(start: number, expectedTime = 20000) {
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
  isElementVisible,
  isBiometricToggleOn
}
