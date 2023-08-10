/* eslint-disable jest/expect-expect */
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import AccountManagePage from '../../pages/accountManage.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'

describe('Add and edit accounts', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should verify not enough avax screen items on Mainnet', async () => {
    await AccountManagePage.createAccount(4)
    await BottomTabsPage.tapStakeTab()
    await GetStartedScreenPage.tapNextButton()
    const startTime = new Date().getTime()
    await Actions.waitForElement(StakePage.notEnoughAvaxTitle)
    const endTime = new Date().getTime()
    await StakePage.verifyStakeScreenItems()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'NotEnoughAvaxScreen',
      1,
      3
    )
  })
})
