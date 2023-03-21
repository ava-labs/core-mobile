/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
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
    await AccountManagePage.tapAddEditAccounts()
    await AccountManagePage.tapAddAccountButton()
    await Assert.isVisible(AccountManagePage.secondAccount)
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
