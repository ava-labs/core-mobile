import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'

describe('Settings', () => {
  it('Accounts - should auto-add the second account', async () => {
    await warmup()
    await common.goMyWallets()
    await settings.verifyMyWalletsAccountName(sl.account)
    await settings.verifyMyWalletsAccountName(sl.account2)
  })

  it('Accounts - should verify the account detail', async () => {
    await settings.goToAccountDetail()
    await common.verifyAccountName(sl.account)
  })

  it('Accounts - should rename the account name', async () => {
    // Rename on account detail
    await settings.tapRenameAccount()
    await settings.setNewAccountName(sl.newAccountName)
    // Verify the new name on account detail
    await common.verifyAccountName(sl.newAccountName)
    await common.goBack()

    // verify the new name on my wallets
    await settings.verifyMyWalletsAccountName(sl.newAccountName)

    // verify the new name on portfolio
    await common.goBack()
    await common.verifyAccountName(sl.newAccountName, 'portfolio')
  })

  it('Accounts - should add an account', async () => {
    await common.goMyWallets()
    await settings.addAccount(3)
    await settings.verifyMyWalletsAccountName(sl.account3)
    await common.goBack()
  })

  it('Accounts - should switch account', async () => {
    await common.verifyAccountName(sl.account3, 'portfolio')
    await settings.switchAccount(sl.newAccountName)
    await common.verifyAccountName(sl.newAccountName, 'portfolio')
  })
})
