/* eslint-disable @typescript-eslint/no-explicit-any */
/*eslint max-params: ["error", 4]*/

import { expect } from 'detox'
import Constants from './constants'
import actions from './actions'
const wb =
  device.getPlatform() === 'ios'
    ? web(by.id('myWebview'))
    : web(by.type('android.webkit.WebView').withAncestor(by.id('myWebview')))

// scripts in JavaScript to run on the web
export enum WebScripts {
  CLICK_WC_ALL_WALLETS = "(element) => { element.shadowRoot.querySelector('w3m-router').shadowRoot.querySelector('w3m-connect-view').shadowRoot.querySelector('wui-list-wallet[name=\"All Wallets\"]').click()}",
  CLICK_WC_QR_BUTTON = "(element) => { element.shadowRoot.querySelector('w3m-router').shadowRoot.querySelector('w3m-all-wallets-view').shadowRoot.querySelector('wui-icon-box').click()}",
  GET_WC_URI = "(element) => { return element.shadowRoot.querySelector('w3m-router').shadowRoot.querySelector('w3m-connecting-wc-view').shadowRoot.querySelector('w3m-connecting-wc-qrcode').shadowRoot.querySelector('wui-qr-code').getAttribute('uri')}",
  CLICK_WCM_IOS_MODAL = "(element) => { element.shadowRoot.querySelector('wcm-modal-router').shadowRoot.querySelector('wcm-connect-wallet-view').shadowRoot.querySelector('wcm-mobile-wallet-selection').shadowRoot.querySelector('wcm-modal-header').shadowRoot.querySelector('button').click()}",
  CLICK_WCM_ANDROID_MODAL = "(element) => { element.shadowRoot.querySelector('wcm-modal-router').shadowRoot.querySelector('wcm-connect-wallet-view').shadowRoot.querySelector('wcm-android-wallet-selection').shadowRoot.querySelector('wcm-modal-header').shadowRoot.querySelector('button').click()}",
  GET_WCM_URI = "(element) => { return element.shadowRoot.querySelector('wcm-modal-router').shadowRoot.querySelector('wcm-qrcode-view').shadowRoot.querySelector('wcm-walletconnect-qr').shadowRoot.querySelector('wcm-qrcode').getAttribute('uri')}",
  CLICK_WC_CORE = "(element) => { element.shadowRoot.querySelector('wui-flex > wui-card > w3m-router').shadowRoot.querySelector('w3m-connect-view').shadowRoot.querySelector('wui-list-wallet[name=\"Core\"]').click()}"
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
  let errorMessage = ''
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
      if (e.message.includes(Constants.webViewWError)) {
        errorMessage = e.message
      }
    }
  }
  console.error('Error: Element not visible within timeout')
  throw new Error(errorMessage)
}

const waitAndRunScript = async (
  header: string,
  func: string,
  timeout = 5000
) => {
  let errorMessage = ''
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      return await wb.element(by.web.tag(header)).runScript(func, [func])
    } catch (e: any) {
      if (e.message.includes(Constants.webViewWError)) {
        errorMessage = e.message
      }
    }
  }
  console.error('Error: Element not visible within timeout')
  throw new Error(errorMessage)
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
  verifyUrl
}
