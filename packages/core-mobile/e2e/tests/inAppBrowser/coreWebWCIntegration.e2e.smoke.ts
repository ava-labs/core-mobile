/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import BottomTabsPage from '../../pages/bottomTabs.page'
import actions from '../../helpers/actions'
import browserPage from '../../pages/browser.page'
import commonElsPage from '../../pages/commonEls.page'
import delay from '../../helpers/waits'

describe('Connect to dApp using WalletConnect', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should navigate core.app page', async () => {
    await actions.waitForElement(BottomTabsPage.plusIcon, 10, 1)
    await BottomTabsPage.tapBrowserTab()
    await commonElsPage.tapGetStartedButton()
    await browserPage.tapSearchBar()
    await browserPage.enterBrowserSearchQuery('core.app')
  })

  it('should connect to dApp', async () => {
    delay(10000)
    const myWebView = web(by.id('webview'))
    const connectBtn = myWebView.element(
      by.web.xpath('(//button[@data-test-id="connect-wallet-button"])[0]')
    )
    await connectBtn.tap()
  })

  afterAll(async () => {
    actions.writeQrCodeToFile('')
  })
})
