import settings from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import warmup from '../../helpers/warmup'

describe('Settings', () => {
  it('Accounts - should verify the account detail', async () => {
    // go to the account detail from the accounts carousel
    await warmup()
    await settings.goSettings()
    await settings.goToAccountDetail(undefined, sl.account)
    await common.verifyAccountName(sl.account)
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

  it('Accounts - should auto-add the second account', async () => {
    await settings.verifyAccountCarouselItem(sl.account2)
    await settings.tapManageAccountsBtn()
    await settings.verifyManageAccountsListItem(sl.account2)
  })

  it('Accounts - should add an account', async () => {
    await settings.addAccount(3)
    await common.dismissBottomSheet()
  })

  it('Accounts - should switch account', async () => {
    await common.verifyAccountName(sl.account3, 'portfolio')
    await settings.switchAccount(sl.newAccountName)
    await common.verifyAccountName(sl.newAccountName, 'portfolio')
  })
})
