/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import AccountManagePage from '../../pages/accountManage.page'
import actions from '../../helpers/actions'
import { warmup } from '../../helpers/warmup'

describe('Add and edit accounts', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should add second account', async () => {
    await AccountManagePage.tapAccountMenu()
    const startTime = new Date().getTime()
    await Actions.waitForElement(AccountManagePage.addEditAccount)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'AccountMenuScreen',
      1,
      3
    )
    await AccountManagePage.tapAddEditAccounts()
    await AccountManagePage.tapAddAccountButton()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(AccountManagePage.secondAccount)
    const endTime2 = new Date().getTime()
    await Assert.isVisible(AccountManagePage.secondAccount)
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'AddSecondAccountFlow',
      1,
      3
    )
  })

  it('should edit first account', async () => {
    await AccountManagePage.tapEditAccount()
    await AccountManagePage.setNewAccountName()
    await AccountManagePage.tapSaveNewAccountName()
    if (
      (await actions.isVisible(AccountManagePage.saveNewAccountName, 0)) ===
      true
    ) {
      await AccountManagePage.tapSaveNewAccountName()
    }
    await Assert.isNotVisible(AccountManagePage.saveNewAccountName)
    await Assert.isVisible(AccountManagePage.newAccountName)
  })

  it('should switch to second Account', async () => {
    await AccountManagePage.tapDoneButton()
    await Assert.isVisible(AccountManagePage.secondAccount)
  })
})
