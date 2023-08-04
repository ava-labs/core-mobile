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
    await AccountManagePage.tapAccountMenu()
    await Actions.waitForElement(AccountManagePage.addEditAccount)
    await AccountManagePage.tapAddEditAccounts()
    for (let i = 0; i < 3; i++) {
      await AccountManagePage.tapAddAccountButton()
    }
    await Actions.waitForElement(AccountManagePage.fourthAccount)
    await AccountManagePage.tapDoneButton()
    await BottomTabsPage.tapStakeTab()
    await GetStartedScreenPage.verifyGetStartedScreenItems()
  })

  it('should verify Disclamer Text on Mainnet', async () => {
    await GetStartedScreenPage.tapDisclaimerText()
    await GetStartedScreenPage.verifyDisclaimerScreenItems()
  })
})
