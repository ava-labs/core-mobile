/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import assert from 'assert'
import actions from '../../helpers/actions'
import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'
import settingsLoc from '../../locators/settings.loc'
import commonElsPage from '../../pages/commonEls.page'

describe('Settings - Manage Accounts', () => {
  beforeAll(async () => {
    await warmup()
  })

  const newAccount = 2
  const oldAccount = 1

  it('Should verify the account detail', async () => {
    // Switch to the first account (oldAccount)
    const accountName =
      (await commonElsPage.getBalanceHeaderAccountName()) || 'Wallet 1'
    // await settingsPage.selectAccount(oldAccount)

    // Go to the account detail
    await settingsPage.goToAccountDetail(oldAccount)
    await settingsPage.verifyAccountDetail(accountName)
  })

  it('Should rename the account name', async () => {
    // Rename on account detail
    await settingsPage.tapRenameAccount()
    await settingsPage.setNewAccountName(settingsLoc.newAccountName)

    // Verify the new name on account detail
    await commonElsPage.verifyAccountName(settingsLoc.newAccountName, 1) // the element at #0 index is the wallet name on portfolio

    // Verify the new name on portfolio page
    await commonElsPage.dismissBottomSheet()
    await commonElsPage.verifyAccountName(settingsLoc.newAccountName)

    // Verify the new name on settings
    await settingsPage.goSettings()
    const newName = await actions.getElementText(
      by.id(`${settingsLoc.accountNameIdPrefix}${oldAccount}`)
    )
    assert(newName === settingsLoc.newAccountName)
  })

  it('should add new account', async () => {
    // Verify the account boxes
    await settingsPage.verifyAccountBoxes(oldAccount)

    // Verify the new account box is not visible
    await assertions.isNotVisible(
      by.id(`${settingsLoc.accountNameIdPrefix}${newAccount}`)
    )

    // Add new account and verify the new account box
    // await settingsPage.tapAddAccountBtn()
    await actions.waitForElement(by.text(`Account ${newAccount}`))
  })

  it('should switch account', async () => {
    await actions.tap(by.text(`Account ${newAccount}`))
    await commonElsPage.dismissBottomSheet()

    // Get the current account name on Portfolio
    const currPortfolioName = await commonElsPage.getBalanceHeaderAccountName()

    // Assert the names are NOT the same
    assert(
      settingsLoc.firstAccountName !== currPortfolioName,
      `Account name mismatch: ${settingsLoc.firstAccountName} === ${currPortfolioName}`
    )

    // Switch to the first account (oldAccount)
    // await settingsPage.selectAccount(oldAccount)

    // Get the first account name that you just switched to
    const newName = await actions.getElementText(
      by.id(`${settingsLoc.accountNameIdPrefix}${oldAccount}`)
    )
    await commonElsPage.dismissBottomSheet()

    // Get the current account name on Portfolio
    const newPortfolioName = await commonElsPage.getBalanceHeaderAccountName()

    // Assert the names are the same
    assert(
      newName === newPortfolioName,
      `Account name mismatch: ${newName} !== ${newPortfolioName}`
    )

    // Assert the names are NOT the same
    assert(
      newName !== currPortfolioName,
      `Account name mismatch: ${newName} === ${currPortfolioName}`
    )
  })
})
