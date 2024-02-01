import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import AccountManagePage from '../../pages/accountManage.page'
import { warmup } from '../../helpers/warmup'

describe('Add and edit accounts', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    if (process.env.SEEDLESS_TEST === 'true') {
      await AccountManagePage.tapCarrotSVG()
      await AccountManagePage.tapFirstAccount()
    }
  })

  it('should add second account', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await AccountManagePage.tapCarrotSVG()
    await Actions.waitForElement(AccountManagePage.addEditAccount)
    await AccountManagePage.tapAddEditAccounts()
    await AccountManagePage.tapAddAccountButton()
    await AccountManagePage.tapSecondAccount()
    await Actions.waitForElement(AccountManagePage.secondAccount, 10000)
  })

  it('should edit first account', async () => {
    await AccountManagePage.tap2ndAccountMenu()
    await AccountManagePage.tapAddEditAccounts()
    await AccountManagePage.tapEditAccount()
    const acctName = await AccountManagePage.setNewAccountName()
    await AccountManagePage.tapSaveNewAccountName()
    await AccountManagePage.assertAccountName(acctName)
  })

  it('should switch to second Account', async () => {
    await AccountManagePage.tapDoneButton()
    console.log('tapped done button')
    await Assert.isVisible(AccountManagePage.secondAccount)
  })
})
