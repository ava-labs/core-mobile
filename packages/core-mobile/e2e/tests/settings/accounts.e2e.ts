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

describe('Accounts', () => {
  beforeAll(async () => {
    await warmup()
  })

  const newAccount = 3
  const oldAccount = 1

  it('should add new account', async () => {
    await settingsPage.selectAccount(oldAccount)
    await settingsPage.verifyAccountBoxes(oldAccount)
    await assertions.isNotVisible(by.id(`account_name__account #${newAccount}`))
    await settingsPage.tapAddAccountBtn()
    await actions.waitForElement(by.id(`account_name__account #${newAccount}`))
  })

  it('should switch account', async () => {
    // Check account name before editing
    const currName = await actions.getElementText(
      by.id(`account_name__account #${newAccount}`)
    )
    await cp.dismissBottomSheet()
    const currPortfolioName = await cp.getBalanceHeaderAccountName()
    assert(
      currName === currPortfolioName,
      `Account name mismatch: ${currName} !== ${currPortfolioName}`
    )

    await settingsPage.selectAccount(oldAccount)

    // Check account name before editing
    const newName = await actions.getElementText(
      by.id(`account_name__account #${oldAccount}`)
    )
    await cp.dismissBottomSheet()
    const newPortfolioName = await cp.getBalanceHeaderAccountName()
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
