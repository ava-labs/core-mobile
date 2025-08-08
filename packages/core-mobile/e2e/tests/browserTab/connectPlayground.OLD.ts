/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import popUpModalPage from '../../pages/popUpModal.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import advancedPage from '../../pages/burgerMenu/advanced.page'
import commonElsPage from '../../pages/commonEls.page'
import connectToSitePage from '../../pages/connectToSite.page'
import plusMenuPage from '../../pages/plusMenu.page'
import portfolioPage from '../../pages/portfolio.page'
import sendPage from '../../pages/send.page'
import actions from '../../helpers/actions'

describe('Dapp - Core Playground', () => {
  it('should connect playground', async () => {
    await warmup()
    await browserPage.connect(
      'https://ava-labs.github.io/extension-avalanche-playground/'
    )
    const qrUri = await browserPage.getPlaygroundUri()
    console.log(qrUri)
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await bottomTabsPage.tapPortfolioTab()
  })

  it('should handle eth_sendTransaction', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.sendRpcCall('eth_sendTransaction')
    await popUpModalPage.tapApproveBtn()
    await sendPage.verifySuccessToast()
  })

  it('should handle eth_signTypedData', async () => {
    await browserPage.sendRpcCall('eth_signTypedData')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
  })

  it('should handle eth_signTypedData_v3', async () => {
    await browserPage.sendRpcCall('eth_signTypedData_v3')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
  })

  it('should handle eth_signTypedData_v4', async () => {
    await browserPage.sendRpcCall('eth_signTypedData_v4')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
  })

  it('should handle eth_sign', async () => {
    await browserPage.sendRpcCall('eth_sign')
    await popUpModalPage.verifyScamTransactionModal()
    await popUpModalPage.tapProceedAnyway()
    await popUpModalPage.verifyScamAlertedSignMessageModal()
    await popUpModalPage.tapRejectBtn()
  })

  it('should handle personal_sign', async () => {
    await browserPage.sendRpcCall('personal_sign')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
  })

  it('should handle avalanche_signMessage', async () => {
    await browserPage.sendRpcCall('avalanche_signMessage')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
  })

  it('should handle wallet_addEthereumChain', async () => {
    await browserPage.sendRpcCall('wallet_addEthereumChain')
    await popUpModalPage.switchToSepoliaNetwork()
    await actions.waitForElement(commonElsPage.testnetBanner, 10000)
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToMainnet()
  })

  it('should handle wallet_switchEthereumChain', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.sendRpcCall('wallet_switchEthereumChain')
    await popUpModalPage.switchToFujiNetwork()
    await actions.waitForElement(commonElsPage.testnetBanner, 10000)
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.verifyActiveNetwork('Avalanche (C-Chain)')
    await advancedPage.switchToMainnet()
  })
})
