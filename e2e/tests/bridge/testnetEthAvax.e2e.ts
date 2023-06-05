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
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'

describe('Bridge transfer testnet ETH -> AVAX', () => {
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
    await BridgeTabPage.tapTransferButton()

    await Assert.isVisibleNoSync(BridgeTabPage.avalancheNetwork)
    await Assert.isVisibleNoSync(BridgeTabPage.ethereumNetwork)
    await Assert.isVisibleNoSync(BridgeTabPage.sendingAmmount)
    await Assert.isVisibleNoSync(BridgeTabPage.fromText)
    await Assert.isVisibleNoSync(BridgeTabPage.networkFee)
    await Assert.isVisibleNoSync(BridgeTabPage.confirmations)
    await Assert.isVisibleNoSync(BridgeTabPage.toText)
  }, 1800000)

  it('Should verify transaction succeeded', async () => {
    await Actions.waitForElementNoSync(BridgeTabPage.closebutton, 1800000)
    await Assert.isVisible(BridgeTabPage.completedStatusEth)
    await Assert.isVisible(BridgeTabPage.completedStatusAvax)

    await BridgeTabPage.tapClose()
    await BottomTabsPage.tapActivityTab()
    await Assert.isVisible(BridgeTabPage.ethBridgeTransaction)
  }, 1800000)
})
