import { warmup } from '../helpers/warmup'
import actions from '../helpers/actions'
import receivePage from '../pages/receive.page'
import commonElsPage from '../pages/commonEls.page'
import commonElsLoc from '../locators/commonEls.loc'

describe('Receive Address', () => {
  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()
  })

  it('should verify Receive Screen', async () => {
    await receivePage.tapReceiveIcon()
    await receivePage.verifyReceiveScreen()
  })

  it('should verify bitcoin address', async () => {
    // Select bitcoin network
    await receivePage.tapSelectReceiveNetwork()
    await actions.waitAndTap(commonElsPage.selectNetworkBitcoin)

    // Verify Bitcoin address
    await actions.isVisible(receivePage.selectedNetworkBitcoin, 0)
    await actions.isVisible(receivePage.bitcoinAddress, 0)

    // Copy Bitcoin address
    await actions.waitAndTap(commonElsPage.copy)
    await actions.waitForElementNoSync(
      by.text(commonElsLoc.bitcoin + ' address copied')
    )
  })

  it('should verify evm address', async () => {
    // Select C-Chain/EVM network
    await receivePage.tapSelectReceiveNetwork()
    await actions.waitAndTap(commonElsPage.selectNetworkCChainEVM)

    // Verify C-Chain/EVM address
    await actions.isVisible(receivePage.selectedNetworkEVM, 0)
    await actions.isVisible(receivePage.cChainAddress, 0)

    // Copy C-Chain/EVM address
    await actions.waitAndTap(commonElsPage.copy)
    await actions.waitForElementNoSync(
      by.text(commonElsLoc.evmNetwork + ' address copied')
    )
  })

  it('should verify X/P-Chain address', async () => {
    // Select X/P network
    await receivePage.tapSelectReceiveNetwork()
    await actions.waitAndTap(commonElsPage.selectNetworkXPChain)

    // Verify X/P address
    await actions.waitForElementNoSync(receivePage.selectedNetworkXPChain)
    await actions.isVisible(commonElsPage.pChain, 0)
    await actions.isVisible(commonElsPage.xChain, 0)
    await actions.isVisible(receivePage.pChainAddress, 0)
    await actions.isVisible(receivePage.xChainAddress, 0)

    // Copy X Chanin address
    await actions.tapElementAtIndex(commonElsPage.copy, 0)
    await actions.waitForElementNoSync(
      by.text(commonElsLoc.xChain + ' address copied')
    )
    // Copy P Chanin address
    await actions.tapElementAtIndex(commonElsPage.copy, 1)
    await actions.waitForElementNoSync(
      by.text(commonElsLoc.pChain + ' address copied')
    )
  })
})
