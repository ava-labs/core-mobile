import actions from '../../../helpers/actions'
import { SwapTokens } from '../../../helpers/tokens'
import { warmup } from '../../../helpers/warmup'
import swapTabLoc from '../../../locators/swapTab.loc'
import activityTabPage from '../../../pages/activityTab.page'
import portfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import SwapTabPage from '../../../pages/swapTab.page'

describe('Swap AVAX', () => {
  beforeEach(async () => {
    const newInstance = actions.platform() === 'android' ? true : false
    await warmup(newInstance)
  })

  SwapTokens.forEach(({ symbol, amount }) => {
    test(`should swap AVAX <> ${symbol}`, async () => {
      await SwapTabPage.swap(swapTabLoc.avaxSymbol, symbol, amount)
      await SendPage.verifySuccessToast()
      console.log(`${symbol}: Swap Transaction Successful`)
    })
  }, 120000)

  it('should verify swap transaction on activity tab', async () => {
    await portfolioPage.goToActivityTab()
    await activityTabPage.verifyNewRow('Contract Call', '-0.000000000001 AVAX')
  })
})
