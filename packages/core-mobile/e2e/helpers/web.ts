/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint max-params: ["error", 4]*/

import { expect } from 'detox'
import actions from './actions'

const wb =
  device.getPlatform() === 'ios'
    ? web(by.id('myWebview'))
    : web(by.type('android.webkit.WebView').withAncestor(by.id('myWebview')))

// scripts in JavaScript to run on the web
export enum WebScripts {
  CLICK_WCM_IOS_MODAL = `(element) => {
    element.shadowRoot.querySelector('wcm-modal-router')
      .shadowRoot.querySelector('wcm-connect-wallet-view')
      .shadowRoot.querySelector('wcm-mobile-wallet-selection')
      .shadowRoot.querySelector('wcm-modal-header')
      .shadowRoot.querySelector('button').click();
  }`,
  CLICK_WCM_ANDROID_MODAL = `(element) => {
    element.shadowRoot.querySelector('wcm-modal-router')
      .shadowRoot.querySelector('wcm-connect-wallet-view')
      .shadowRoot.querySelector('wcm-android-wallet-selection')
      .shadowRoot.querySelector('wcm-modal-header')
      .shadowRoot.querySelector('button').click();
  }`,
  GET_WCM_URI = `(element) => {
    return element.shadowRoot.querySelector('wcm-modal-router')
      .shadowRoot.querySelector('wcm-qrcode-view')
      .shadowRoot.querySelector('wcm-walletconnect-qr')
      .shadowRoot.querySelector('wcm-qrcode')
      .getAttribute('uri');
  }`,
  CLICK_WC_CORE = `(element) => {
    element.shadowRoot.querySelector('wui-flex > wui-card > w3m-router')
      .shadowRoot.querySelector('w3m-connect-view')
      .shadowRoot.querySelector('wui-list-wallet[name="Core"]').click();
  }`,
  EXIST_WC_CORE = `(element) => {
    return element.shadowRoot.querySelector('wui-flex > wui-card > w3m-router')
      .shadowRoot.querySelector('w3m-connect-view')
      .shadowRoot.querySelector('wui-list-wallet[name="Core"]') !== null;
  }`
}

const tap = async (item: Detox.WebMatcher) => {
  await wb.element(item).tap()
}

const tapByXpath = async (xpath: string) => {
  await waitForEleByXpathToBeVisible(xpath)
  await wb.element(by.web.xpath(xpath)).tap()
}

const tapByDataTestId = async (dataTestId: string) => {
  await wb.element(by.web.xpath(`//*[@data-testid="${dataTestId}"]`)).tap()
}

const tapByText = async (text: string) => {
  await waitForEleByTextToBeVisible(text)
  await wb.element(by.web.xpath(`//*[text()="${text}"]`)).tap()
}

const isTextVisible = async (text: string) => {
  await expect(
    wb.element(by.web.xpath(`//*[contains(., "${text}")]`))
  ).toExist()
}

const waitForWebElement = async (
  xpath?: string,
  text?: string,
  timeout = 5000
) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      if (xpath) {
        await expect(wb.element(by.web.xpath(xpath))).toExist()
      } else if (text) {
        await expect(
          wb.element(by.web.xpath(`//*[contains(., "${text}")]`))
        ).toExist()
      }
      return
    } catch (e: any) {
      console.log(`waitForWebElement - ${xpath || text} is NOT visible yet`)
    }
  }
  console.error('Error: Element not visible within timeout')
  throw new Error(`waitForWebElement - ${xpath || text} is NOT visible yet`)
}

const isVisibleByRunScript = async (
  header: string,
  func: string,
  timeout = 5000
) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const ele = wb.element(by.web.tag(header))
      const output = await ele.runScript(func)
      if (output) {
        console.log(`Element ${header} is visible`)
        return true
      }
    } catch (e) {
      console.error(`isVisibleByRunScript - ${header} is NOT visible yet`)
    }
  }
  console.error(`Timeout: isVisibleByRunScript - ${header} is NOT visible`)
  return false
}

const waitAndRunScript = async (
  header: string,
  func: string,
  timeout = 5000
) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      await wb.element(by.web.tag(header)).runScript(func)
      return
    } catch (e: any) {
      console.error(`waitAndRunScript - ${header} is NOT visible yet`)
    }
  }
  throw Error(`Timeout: waitAndRunScript - ${header} is NOT visible`)
}

const getElementTextByRunScript = async (
  header: string,
  func: string,
  timeout = 5000
) => {
  let output = ''
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      output = await wb.element(by.web.tag(header)).runScript(func)
      if (output) break
    } catch (e: any) {
      console.error(`Element ${header} not visible`)
    }
  }
  return output
}

const verifyUrl = async (url: string, timeout = 5000) => {
  await actions.waitForCondition(
    () => wb.element(by.web.tag('body')).getCurrentUrl(),
    (result: string) => result === url || result.includes(url),
    timeout
  )
}

const scrollToXpath = async (xpath: string) => {
  await wb.element(by.web.xpath(xpath)).scrollToView()
}

const scrollToText = async (text: string) => {
  await waitForEleByTextToBeVisible(text)
  await wb.element(by.web.xpath(`//*[text()="${text}"]`)).scrollToView()
}

const waitForEleByXpathToBeVisible = async (xpath: string, timeout = 5000) => {
  await waitForWebElement(xpath, undefined, timeout)
}

const waitForEleByTextToBeVisible = async (text: string, timeout = 5000) => {
  await waitForWebElement(undefined, text, timeout)
}

const setInputText = async (xpath: string, text: string) => {
  await waitForEleByXpathToBeVisible(xpath)
  await wb.element(by.web.xpath(xpath)).typeText(text, false)
}

export default {
  tap,
  tapByText,
  tapByXpath,
  tapByDataTestId,
  scrollToText,
  scrollToXpath,
  isTextVisible,
  waitForEleByXpathToBeVisible,
  waitForEleByTextToBeVisible,
  waitForWebElement,
  waitAndRunScript,
  getElementTextByRunScript,
  isVisibleByRunScript,
  verifyUrl,
  setInputText
}
