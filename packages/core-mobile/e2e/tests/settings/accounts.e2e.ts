/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import assert from 'assert'
import actions from '../../helpers/actions'
import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import cp from '../../pages/commonEls.page'
import settingsPage from '../../pages/settings.page'
import settingsLoc from '../../locators/settings.loc'

describe('Settings - Accounts', () => {
  beforeAll(async () => {
    await warmup()
  })

  const newAccount = 2
  const oldAccount = 1

  it('should add new account', async () => {
    // Switch to the first account (oldAccount)
    await settingsPage.selectAccount(oldAccount)

    // Verify the account boxes
    await settingsPage.verifyAccountBoxes(oldAccount)

    // Verify the new account box is not visible
    await assertions.isNotVisible(
      by.id(`${settingsLoc.accountNameIdPrefix}${newAccount}`)
    )

    // Add new account and verify the new account box
    await settingsPage.tapAddAccountBtn()
    await actions.waitForElement(
      by.id(`${settingsLoc.accountNameIdPrefix}${newAccount}`)
    )
  })

  it('should switch account', async () => {
    // Get the current account name on Settings
    const currName = await actions.getElementText(
      by.id(`${settingsLoc.accountNameIdPrefix}${newAccount}`)
    )
    await cp.dismissBottomSheet()

    // Get the current account name on Portfolio
    const currPortfolioName = await cp.getBalanceHeaderAccountName()

    // Assert the names are the same
    assert(
      currName === currPortfolioName,
      `Account name mismatch: ${currName} !== ${currPortfolioName}`
    )

    // Switch to the first account (oldAccount)
    await settingsPage.selectAccount(oldAccount)

    // Get the first account name that you just switched to
    const newName = await actions.getElementText(
      by.id(`${settingsLoc.accountNameIdPrefix}${oldAccount}`)
    )
    await cp.dismissBottomSheet()

    // Get the current account name on Portfolio
    const newPortfolioName = await cp.getBalanceHeaderAccountName()

    // Assert the names are the same
    assert(
      newName === newPortfolioName,
      `Account name mismatch: ${newName} !== ${newPortfolioName}`
    )

    assert(
      newName !== currName,
      `Account name mismatch: ${newName} === ${currName}`
    )
  })
})
