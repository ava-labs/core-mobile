/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
// import assertions from '../../../helpers/assertions'
import { warmup } from '../../../helpers/warmup'
import popUpModalPage from '../../../pages/popUpModal.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import browserPage from '../../../pages/browser.page'
import advancedPage from '../../../pages/burgerMenu/advanced.page'
import commonElsPage from '../../../pages/commonEls.page'
import connectToSitePage from '../../../pages/connectToSite.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'
import assertions from '../../../helpers/assertions'

describe('Dapp - Core Playground', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should connect to Core Playground', async () => {
    await browserPage.connectTo(
      'https://ava-labs.github.io/extension-avalanche-playground/',
      false,
      false
    )
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await bottomTabsPage.tapPortfolioTab()
  }, 60000)

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
    await assertions.isVisible(commonElsPage.testnetBanner)
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToMainnet()
  })

  it('should handle wallet_switchEthereumChain', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.sendRpcCall('wallet_switchEthereumChain')
    await popUpModalPage.switchToFujiNetwork()
    await assertions.isVisible(commonElsPage.testnetBanner)
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.verifyActiveNetwork('Avalanche (C-Chain)')
    await advancedPage.switchToMainnet()
  })
})
