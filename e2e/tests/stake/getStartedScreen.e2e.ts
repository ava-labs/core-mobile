/* eslint-disable jest/expect-expect */

import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import AccountManagePage from '../../pages/accountManage.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'

describe('Add and edit accounts', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should verify get started screen on Mainnet', async () => {
    await AccountManagePage.createAccount(4)
    await BottomTabsPage.tapStakeTab()
    const startTime = new Date().getTime()
    await Actions.waitForElement(GetStartedScreenPage.getStartedTitle)
    const endTime = new Date().getTime()
    await GetStartedScreenPage.verifyGetStartedScreenItems()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'StakeGetStartedScreen',
      1,
      3
    )
  })

  it('should verify Disclamer Text on Mainnet', async () => {
    await GetStartedScreenPage.tapDisclaimerText()
    await GetStartedScreenPage.verifyDisclaimerScreenItems()
  })
})
