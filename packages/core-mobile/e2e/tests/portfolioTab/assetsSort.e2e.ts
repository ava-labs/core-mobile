import assert from 'assert'
import actions from '../../helpers/actions'

import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'
import commonElsLoc from '../../locators/commonEls.loc'

describe('Assets Tab Sort', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should sort assets in descending order', async () => {
    let previousAmount = actions.getAmount(
      await actions.getElementText(by.id('list_fiat_balance__0'))
    )

    for (let i = 1; i < 3; i++) {
      const currentAmount = actions.getAmount(
        await actions.getElementText(by.id(`list_fiat_balance__${i}`))
      )

      assert(
        previousAmount > currentAmount,
        `Expected ${previousAmount} to be greater than ${currentAmount}`
      )

      previousAmount = currentAmount
    }
  })

  it('should sort assets in ascending order', async () => {
    await commonElsPage.selectDropdown('Filter', commonElsLoc.ethereum)
    await commonElsPage.selectDropdown('Sort', 'Low to high balance')
    let previousAmount = actions.getAmount(
      await actions.getElementText(by.id('list_fiat_balance__0'))
    )

    for (let i = 1; i < 3; i++) {
      const currentAmount = actions.getAmount(
        await actions.getElementText(by.id(`list_fiat_balance__${i}`))
      )

      assert(
        previousAmount < currentAmount,
        `Expected ${previousAmount} to be less than ${currentAmount}`
      )

      previousAmount = currentAmount
    }
  })
})
