/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'
import BurgerMenuPage from '../../pages/burgerMenu.page'

describe('Bridge transfer ETH -> AVAX', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Transaction Status Items', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAdvanced()
    await BurgerMenuPage.switchToTestnet()
    await BurgerMenuPage.tapBackbutton()
    await BurgerMenuPage.swipeLeft()

    await BottomTabsPage.tapBridgeTab()
    await BridgeTabPage.tapNetworkDropdown()
    await BridgeTabPage.tapEthereumNetwork()
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapWrappedEther()
    await BridgeTabPage.inputTokenAmmountEthAvax()
    await Actions.waitForElement(BridgeTabPage.transferButton, 100000)
    await BridgeTabPage.tapTransferButton()

    await Assert.isVisible(BridgeTabPage.avalancheNetwork)
    await Assert.isVisible(BridgeTabPage.ethereumNetwork)
    await Assert.isVisible(BridgeTabPage.sendingAmmount)
    await Assert.isVisible(BridgeTabPage.fromText)
    await Assert.isVisible(BridgeTabPage.networkFee)
    await Assert.isVisible(BridgeTabPage.confirmations)
    await Assert.isVisible(BridgeTabPage.toText)
  }, 1800000)

  it('Should verify transaction succeeded', async () => {
    await Actions.waitForElement(BridgeTabPage.closebutton, 1800000)
    await Assert.isVisible(BridgeTabPage.completedStatusEth)
    await Assert.isVisible(BridgeTabPage.completedStatusAvax)

    await BridgeTabPage.tapClose()
    await BottomTabsPage.tapActivityTab()
    await Assert.isVisible(BridgeTabPage.ethBridgeTransaction)
  }, 1800000)
})
