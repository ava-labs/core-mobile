/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../helpers/actions'
import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import approveTransactionPage from '../../pages/approveTransaction.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import advancedPage from '../../pages/burgerMenu/advanced.page'
import burgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import commonElsPage from '../../pages/commonEls.page'
import connectToSitePage from '../../pages/connectToSite.page'
import plusMenuPage from '../../pages/plusMenu.page'
import popUpModalPage from '../../pages/popUpModal.page'
import portfolioPage from '../../pages/portfolio.page'

describe('Connect to dApp using WalletConnect', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should connect Core DApp Playground', async () => {
    await browserPage.connectTo(
      'https://ava-labs.github.io/extension-avalanche-playground/',
      false,
      false
    )
    const qrUri = await browserPage.getQrUriViaAllWallets()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect('Core DApp Playground')
    await bottomTabsPage.tapPortfolioTab()
  })

  it('should handle eth_sendTransaction', async () => {
    await browserPage.sendRpcCall('eth_sendTransaction')
    await approveTransactionPage.verifyApproveTransactionItems()
    await approveTransactionPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
    await bottomTabsPage.tapPortfolioTab()
    await actions.waitForElement(
      approveTransactionPage.successfulToastMsg,
      10000
    )
    await actions.waitForElementNotVisible(
      approveTransactionPage.successfulToastMsg,
      3000
    )
  })

  it('should handle eth_signTypedData', async () => {
    await browserPage.sendRpcCall('eth_signTypedData')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
  })

  it('should handle eth_signTypedData_v1', async () => {
    await browserPage.sendRpcCall('eth_signTypedData_v1')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived()
  })

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

  it('should handle avalanche_createContact', async () => {
    await browserPage.sendRpcCall('avalanche_createContact')
    await popUpModalPage.verifyCreateContactModal()
    await popUpModalPage.tapApproveBtn()
    await browserPage.verifyResponseReceived('Bob')
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapAddressBook()
    await actions.waitForElement(by.text('Bob'))
    await burgerMenuPage.exitBurgerMenu()
  })

  it('should handle avalanche_getContacts', async () => {
    await browserPage.sendRpcCall('avalanche_getContacts')
    await browserPage.verifyResponseReceived('Bob')
  })

  it('should handle avalanche_getAccounts', async () => {
    await browserPage.sendRpcCall('avalanche_getAccounts')
    await browserPage.verifyResponseReceived('testWallet1')
  })

  it('should handle wallet_addEthereumChain: switch to Sepolia Ethereum network', async () => {
    await browserPage.sendRpcCall('wallet_addEthereumChain')
    await popUpModalPage.verifySwitchToSepoliaNetworkModal()
    await popUpModalPage.tapApproveBtn()
    await assertions.isVisible(commonElsPage.testnetBanner)
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToMainnet()
    await burgerMenuPage.exitBurgerMenu()
  })

  it('should handle wallet_switchEthereumChain: switch to Fuji network', async () => {
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
