/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../helpers/actions'
import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import accountManageLoc from '../../locators/accountManage.loc'
import accountManagePage from '../../pages/accountManage.page'
import commonElsPage from '../../pages/commonEls.page'
import portfolioPage from '../../pages/portfolio.page'
import receivePage from '../../pages/receive.page'

describe('Manage Account', () => {
  beforeAll(async () => {
    await warmup()
    await accountManagePage.createNthAccountAndSwitchToNth(2)
  })

  it('should not edit with the invalid account name', async () => {
    // Check account name before editing
    await accountManagePage.tapAccountDropdownTitle()
    await accountManagePage.tapAddEditAccounts()
    // Try to save name without any string
    await accountManagePage.tapEditAccount(1)
    await actions.clearTextInput(commonElsPage.inputTextField)
    await accountManagePage.tapSaveNewAccountName()
    // Verify you can't save the empty string
    await assertions.isVisible(commonElsPage.inputTextField)
    await assertions.isVisible(accountManagePage.saveNewAccountName)
    await accountManagePage.tapDoneButton()
  })

  it('should edit with the valid account name', async () => {
    // Check account name before editing
    await accountManagePage.tapAccountDropdownTitle()
    await accountManagePage.tapAddEditAccounts()
    await accountManagePage.verifyAccountNameOnMyAccounts('Account 2', 1)
    // Edit account name
    await accountManagePage.tapEditAccount(1)
    await commonElsPage.enterTextInput(accountManageLoc.editedAccountName)
    await accountManagePage.tapSaveNewAccountName()

    // Verify the name is edited on `My Accounts` screen
    await accountManagePage.verifyAccountNameOnMyAccounts(
      accountManageLoc.editedAccountName,
      1
    )
    await accountManagePage.tapDoneButton()

    // Verify the edited name is displayed on Portfolio screen
    await portfolioPage.verifyAccountName(accountManageLoc.editedAccountName)
  })

  it('should copy the wallet address', async () => {
    // Hit AvaLogo to copy address
    await accountManagePage.tapAccountDropdownTitle()
    await commonElsPage.tapAvaSVG()
    await assertions.isVisible(receivePage.copiedToastMsg)
    await actions.waitForElementNotVisible(receivePage.copiedToastMsg)

    // Hit Bitcoin Logo to copy address
    await commonElsPage.tapBitcoinSVG()
    await assertions.isVisible(receivePage.copiedToastMsg)
    await actions.waitForElementNotVisible(receivePage.copiedToastMsg)
  })
})
