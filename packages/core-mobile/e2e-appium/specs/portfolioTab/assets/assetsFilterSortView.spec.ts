import assert from 'assert'
import warmup from '../../../helpers/warmup'
import { actions } from '../../../helpers/actions'
import commonElsLoc from '../../../locators/commonEls.loc'
import commonElsPage from '../../../pages/commonEls.page'
import portfolioPage from '../../../pages/portfolio.page'
import { selectors } from '../../../helpers/selectors'

describe('Portfolio tab', () => {
  it('Assets - filter assets by network', async () => {
    await warmup()
    await commonElsPage.filter(commonElsLoc.cChain_2)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.cChain_2)

    await commonElsPage.filter(commonElsLoc.pChain)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.pChain_3)

    await commonElsPage.filter(commonElsLoc.xChain)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.xChain_3)

    await commonElsPage.filter(commonElsLoc.ethereum)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.ethereum)

    await commonElsPage.filter(commonElsLoc.bitcoin)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.bitcoin)

    await commonElsPage.filter(commonElsLoc.allNetworks)
  })

  it('Assets - sort assets', async () => {
    // Ascending order
    let previousAmount = actions.getAmount(
      await actions.getText(selectors.getById('list_fiat_balance__0'))
    )

    for (let i = 1; i < 3; i++) {
      const currentAmount = actions.getAmount(
        await actions.getText(selectors.getById(`list_fiat_balance__${i}`))
      )

      assert(
        previousAmount > currentAmount,
        `Expected ${previousAmount} to be greater than ${currentAmount}`
      )

      previousAmount = currentAmount
    }

    // Descending order
    await commonElsPage.selectDropdown('sort', 'Low to high balance')
    previousAmount = actions.getAmount(
      await actions.getText(selectors.getById('list_fiat_balance__0'))
    )

    for (let i = 1; i < 3; i++) {
      const currentAmount = actions.getAmount(
        await actions.getText(selectors.getById(`list_fiat_balance__${i}`))
      )

      assert(
        previousAmount <= currentAmount,
        `Expected ${previousAmount} to be less than ${currentAmount}`
      )

      previousAmount = currentAmount
    }

    await commonElsPage.selectDropdown('sort', 'High to low balance')
  })

  it('Assets - view assets by grid and list', async () => {
    await commonElsPage.selectDropdown('view', 'Grid view')
    await portfolioPage.verifyAssetRow(0, false)
    await portfolioPage.verifyAssetRow(1, false)
    await portfolioPage.verifyAssetRow(2, false)

    await commonElsPage.selectDropdown('view', 'List view')
    await portfolioPage.verifyAssetRow(0)
    await portfolioPage.verifyAssetRow(1)
    await portfolioPage.verifyAssetRow(2)
  })
})
