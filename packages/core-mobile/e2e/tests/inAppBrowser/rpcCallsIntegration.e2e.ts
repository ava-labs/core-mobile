/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../helpers/actions'
import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import popUpModalPage from '../../pages/popUpModal.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import advancedPage from '../../pages/burgerMenu/advanced.page'
import burgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import commonElsPage from '../../pages/commonEls.page'
import connectToSitePage from '../../pages/connectToSite.page'
import plusMenuPage from '../../pages/plusMenu.page'
import portfolioPage from '../../pages/portfolio.page'

describe('Dapp - Core Playground', () => {
  beforeAll(async () => {
    await warmup()
    await browserPage.connectTo(
      'https://ava-labs.github.io/extension-avalanche-playground/',
      false,
      false
    )
    let qrUri
    try {
      qrUri = await browserPage.getQrUriViaAllWallets()
    } catch (e) {
      qrUri = await browserPage.getQrUri()
    }
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await bottomTabsPage.tapPortfolioTab()
  })

  beforeEach(async () => {
    const newInstance = actions.platform() === 'android' ? true : false
    await warmup(newInstance)
  })

  it('should handle eth_sendTransaction', async () => {
    await browserPage.sendRpcCall('eth_sendTransaction')
    await popUpModalPage.verifyApproveTransactionItems()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
    await bottomTabsPage.tapPortfolioTab()
    await actions.waitForElement(popUpModalPage.successfulToastMsg, 10000)
    await actions.waitForElementNotVisible(
      popUpModalPage.successfulToastMsg,
      10000
    )
  })

  it('should handle eth_signTypedData', async () => {
    await browserPage.sendRpcCall('eth_signTypedData')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
  })

  // it('should handle eth_signTypedData_v1', async () => {
  //   await browserPage.sendRpcCall('eth_signTypedData_v1')
  //   await popUpModalPage.verifySignMessageModal()
  //   await popUpModalPage.tapApproveBtn()
  //   await browserPage.verifyResponseReceived()
  // })

  it('should handle eth_signTypedData_v3', async () => {
    await browserPage.sendRpcCall('eth_signTypedData_v3')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
  })

  it('should handle eth_signTypedData_v4', async () => {
    await browserPage.sendRpcCall('eth_signTypedData_v4')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
  })

  it('should handle eth_sign', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.sendRpcCall('eth_sign')
    await popUpModalPage.verifyScamTransactionModal()
    await popUpModalPage.tapProceedAnyway()
    await popUpModalPage.verifyScamAlertedSignMessageModal()
    await popUpModalPage.tapRejectBtn()
    await browserPage.verifyErrorReceived('User rejected the request.')
  })

  it('should handle personal_sign', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.sendRpcCall('personal_sign')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
  })

  // it('should handle avalanche_createContact', async () => {
  //   await browserPage.sendRpcCall('avalanche_createContact')
  //   await popUpModalPage.verifyCreateContactModal()
  //   await popUpModalPage.tapApproveBtn()
  //   await browserPage.verifyResponseReceived('Bob')
  //   await burgerMenuPage.tapBurgerMenuButton()
  //   await burgerMenuPage.tapAddressBook()
  //   await actions.waitForElement(by.text('Bob'))
  //   await burgerMenuPage.exitBurgerMenu()
  // })

  it('should handle avalanche_getContacts', async () => {
    await browserPage.sendRpcCall('avalanche_getContacts')
    await browserPage.verifyResponseReceived('Bob')
  })

  it('should handle avalanche_getAccounts', async () => {
    await browserPage.sendRpcCall('avalanche_getAccounts')
    await browserPage.verifyResponseReceived('testWallet1')
  })

  it('should handle wallet_addEthereumChain', async () => {
    await browserPage.sendRpcCall('wallet_addEthereumChain')
    await popUpModalPage.verifySwitchToSepoliaNetworkModal()
    await popUpModalPage.tapApproveBtn()
    await assertions.isVisible(commonElsPage.testnetBanner)
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToMainnet()
    await burgerMenuPage.exitBurgerMenu()
  })

  it('should handle wallet_switchEthereumChain', async () => {
    await browserPage.sendRpcCall('wallet_switchEthereumChain')
    await popUpModalPage.verifySwitchToFujiNetworkModal()
    await popUpModalPage.tapApproveBtn()
    await assertions.isVisible(commonElsPage.testnetBanner)
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.verifyActiveNetwork('Avalanche (C-Chain)')
    await advancedPage.switchToMainnet()
    await burgerMenuPage.exitBurgerMenu()
  })
})
