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
    await Actions.waitForElement(AccountManagePage.addEditAccount)
    await AccountManagePage.tapAddEditAccounts()
    await AccountManagePage.tapAddAccountButton()
    await AccountManagePage.tapDoneButton()
    await Actions.waitForElement(AccountManagePage.secondAccount, 10000)
  })

  it('should edit first account', async () => {
    await AccountManagePage.tap2ndAccountMenu()
    await AccountManagePage.tapAddEditAccounts()
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
