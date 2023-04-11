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
import BurgerMenuPage from '../../pages/burgerMenu.page'
import { warmup } from '../../helpers/warmup'

//Currently working on iOS only

describe('Bridge transfer AVAX -> BTC', () => {
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
    await BridgeTabPage.tapAvalanceNetwork()
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapBtcToken()
    await BridgeTabPage.inputTokenAmmountAvaxBtc()
    await Actions.waitForElement(BridgeTabPage.transferButton)
    await BridgeTabPage.tapTransferButton()

    await Assert.isVisible(BridgeTabPage.avalancheNetwork)
    await Assert.isVisible(BridgeTabPage.bitcoinNetwork)
    await Assert.isVisible(BridgeTabPage.sendingAmmount)
    await Assert.isVisible(BridgeTabPage.fromText)
    await Assert.isVisible(BridgeTabPage.networkFee)
    await Assert.isVisible(BridgeTabPage.confirmations)
    await Assert.isVisible(BridgeTabPage.toText)
  }, 5000000)

  it('Should verify transaction succeeded', async () => {
    await Actions.waitForElement(BridgeTabPage.closebutton, 1800000)
    await Assert.isVisible(BridgeTabPage.completedStatusAvax)

    await BridgeTabPage.tapClose()
    await BottomTabsPage.tapActivityTab()
    await Assert.isVisible(BridgeTabPage.avaxBtcBridgeTransaction)
  }, 1800000)
})
