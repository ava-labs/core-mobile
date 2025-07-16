/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import sp from '../../pages/settings.page'
import sl from '../../locators/settings.loc'
import cp from '../../pages/commonEls.page'

describe('Settings - Manage Accounts', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify the account detail', async () => {
    // go to the account detail from the accounts carousel
    await cp.goSettings()
    await sp.goToAccountDetail(sl.account)
    await sp.verifyAccountDetail(sl.account)
    await cp.dismissBottomSheet()

    // go to the account detail from the `manage accounts` screen
    await cp.goSettings()
    await sp.tapManageAccountsBtn()
    await sp.goToAccountDetail(sl.account, sl.walletName)
    await sp.verifyAccountDetail(sl.account)
  })

  it('Should rename the account name', async () => {
    // Rename on account detail
    await sp.tapRenameAccount()
    await sp.setNewAccountName(sl.newAccountName)

    // Verify the new name on account detail
    await cp.verifyAccountName(sl.newAccountName, 1) // the element at #0 index is the wallet name on portfolio

    // Verify the new name on portfolio page
    await cp.dismissBottomSheet()
    await cp.verifyAccountName(sl.newAccountName)

    // Verify the new name on account carousel
    await sp.goSettings()
    await sp.verifyAccountCarouselItem(sl.newAccountName)
  })

  it('should add new account', async () => {
    await sp.tapManageAccountsBtn()
    await sp.addAccount(2)
    await cp.dismissBottomSheet()
  })

  it('should switch account', async () => {
    await cp.verifyAccountName(sl.account2)
    await sp.switchAccount(sl.newAccountName)
    await cp.verifyAccountName(sl.newAccountName)
  })
})
