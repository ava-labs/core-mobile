import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import AccountManagePage from '../../pages/accountManage.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Stake: not enough Avax', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    if (process.env.SEEDLESS_TEST === 'true') {
      await commonElsPage.tapBackButton2()
      await commonElsPage.tapBackButton2()
      await AccountManagePage.switchToFirstAccount()
    }
  })

  it('should verify not enough avax screen items on Mainnet', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    if (process.env.SEEDLESS_TEST === 'false' || !process.env.SEEDLESS_TEST) {
      await AccountManagePage.createAccount(4)
    } else {
      await AccountManagePage.tapCarrotSVG()
      await AccountManagePage.tapFourthAccount()
    }
    await BottomTabsPage.tapStakeTab()
    await GetStartedScreenPage.tapNextButton()
    await Actions.waitForElement(StakePage.notEnoughAvaxTitle)
    await StakePage.verifyStakeScreenItems()
  })
})
