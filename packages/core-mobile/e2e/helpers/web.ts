/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint max-params: ["error", 4]*/

import { expect } from 'detox'
import actions from './actions'

let webviewId = 'myWebview' // 기본값 설정

export const setWebViewId = (id: string) => {
  webviewId = id
}

const getWebView = () => {
  return device.getPlatform() === 'ios'
    ? web(by.id(webviewId))
    : web(by.type('android.webkit.WebView').withAncestor(by.id(webviewId)))
}

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
      .shadowRoot.querySelector('wui-flex > w3m-wallet-login-list')
      .shadowRoot.querySelector('wui-flex > w3m-connector-list')
      .shadowRoot.querySelector('wui-flex > w3m-connect-featured-widget')
      .shadowRoot.querySelector('wui-flex > wui-list-wallet[name="Core"]')
      .click();
  }`,
  EXIST_WC_CORE = `(element) => {
    return element.shadowRoot.querySelector('wui-flex > wui-card > w3m-router')
      .shadowRoot.querySelector('w3m-connect-view')
      .shadowRoot.querySelector('wui-list-wallet[name="Core"]') !== null;
  }`
}

const tap = async (item: Detox.WebMatcher) => {
  await getWebView().element(item).tap()
}

const tapByXpath = async (xpath: string) => {
  await waitForEleByXpathToBeVisible(xpath)
  await getWebView().element(by.web.xpath(xpath)).tap()
}

const tapByDataTestId = async (dataTestId: string) => {
  await getWebView()
    .element(by.web.xpath(`//*[@data-testid="${dataTestId}"]`))
    .tap()
}

const tapByText = async (text: string) => {
  await waitForEleByTextToBeVisible(text)
  await getWebView()
    .element(by.web.xpath(`//*[text()="${text}"]`))
    .tap()
}

const isTextVisible = async (text: string) => {
  await expect(
    getWebView().element(by.web.xpath(`//*[contains(., "${text}")]`))
  ).toExist()
}

const waitForWebElement = async (
  xpath?: string,
  text?: string,
  timeout = 10000
) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      if (xpath) {
        await expect(getWebView().element(by.web.xpath(xpath))).toExist()
      } else if (text) {
        await expect(
          getWebView().element(by.web.xpath(`//*[contains(., "${text}")]`))
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
      const ele = getWebView().element(by.web.tag(header))
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

const isVisibleByXpath = async (xpath: string, timeout = 5000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      await expect(getWebView().element(by.web.xpath(xpath))).toExist()
      return true
    } catch (e) {
      console.error(`isVisibleByXpath - ${xpath} is NOT visible yet`)
    }
  }
  console.error(`Timeout: isVisibleByXpath - ${xpath} is NOT visible`)
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
      await getWebView().element(by.web.cssSelector(header)).runScript(func)
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
      output = await getWebView().element(by.web.tag(header)).runScript(func)
      if (output) break
    } catch (e: any) {
      console.error(`Element ${header} not visible`)
    }
  }
  return output
}

const verifyUrl = async (url: string, timeout = 5000) => {
  await actions.waitForCondition(
    () => getWebView().element(by.web.tag('body')).getCurrentUrl(),
    (result: string) => result === url || result.includes(url),
    timeout
  )
}

const scrollToXpath = async (xpath: string) => {
  await getWebView().element(by.web.xpath(xpath)).scrollToView()
}

const scrollToText = async (text: string) => {
  await waitForEleByTextToBeVisible(text)
  await getWebView()
    .element(by.web.xpath(`//*[text()="${text}"]`))
    .scrollToView()
}

const waitForEleByXpathToBeVisible = async (xpath: string, timeout = 10000) => {
  await waitForWebElement(xpath, undefined, timeout)
}

const waitForEleByTextToBeVisible = async (text: string, timeout = 10000) => {
  await waitForWebElement(undefined, text, timeout)
}

const setInputText = async (xpath: string, text: string) => {
  await waitForEleByXpathToBeVisible(xpath)
  await getWebView().element(by.web.xpath(xpath)).replaceText(text)
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
  setInputText,
  isVisibleByXpath
}
