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
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Bridge transfer testnet AVAX -> BTC', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Transaction Status Items', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAdvanced()
    await AdvancedPage.switchToTestnet()
    await BurgerMenuPage.tapBackbutton()
    await BurgerMenuPage.swipeLeft()

    await BottomTabsPage.tapBridgeTab()
    await BridgeTabPage.tapNetworkDropdown()
    await BridgeTabPage.tapAvalanceNetwork()
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapBtcToken()
    await BridgeTabPage.inputTokenAmmountAvaxBtc()
    await BridgeTabPage.tapTransferButton()

    await Assert.isVisibleNoSync(BridgeTabPage.avalancheNetwork)
    await Assert.isVisibleNoSync(BridgeTabPage.bitcoinNetwork)
    await Assert.isVisibleNoSync(BridgeTabPage.sendingAmmount)
    await Assert.isVisibleNoSync(BridgeTabPage.fromText)
    await Assert.isVisibleNoSync(BridgeTabPage.networkFee)
    await Assert.isVisibleNoSync(BridgeTabPage.confirmations)
    await Assert.isVisibleNoSync(BridgeTabPage.toText)
  }, 5000000)

  it('Should verify transaction succeeded', async () => {
    await Actions.waitForElementNoSync(BridgeTabPage.closebutton, 1800000)
    await Assert.isVisible(BridgeTabPage.completedStatusAvax)

    await BridgeTabPage.tapClose()
    await BottomTabsPage.tapActivityTab()
    await Assert.isVisible(BridgeTabPage.avaxBtcBridgeTransaction)
  }, 1800000)
})
