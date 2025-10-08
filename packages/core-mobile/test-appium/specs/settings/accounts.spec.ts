import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'

describe('Settings', () => {
  it('Accounts - should verify the account detail', async () => {
    // go to the account detail from the accounts carousel
    await warmup()
    await common.goSettings()
    await settings.goToAccountDetail(sl.account)
    await settings.verifyAccountDetail(sl.account)
  })

  it('Accounts - should rename the account name', async () => {
    // Rename on account detail
    await settings.tapRenameAccount()
    await settings.setNewAccountName(sl.newAccountName)

    // Verify the new name on account detail
    await common.verifyAccountName(sl.newAccountName)

    // Verify the new name on portfolio page
    await common.dismissBottomSheet()
    await common.verifyAccountName(sl.newAccountName, 'portfolio')

    // Verify the new name on account carousel
    await settings.goSettings()
    await settings.verifyAccountCarouselItem(sl.newAccountName)
  })

  it('Accounts - should add new account', async () => {
    await settings.tapManageAccountsBtn()
    await settings.addAccount(2)
    await common.dismissBottomSheet()
  })

  it('Accounts - should switch account', async () => {
    await common.verifyAccountName(sl.account2, 'portfolio')
    await settings.switchAccount(sl.newAccountName)
    await common.verifyAccountName(sl.newAccountName, 'portfolio')
  })
})
