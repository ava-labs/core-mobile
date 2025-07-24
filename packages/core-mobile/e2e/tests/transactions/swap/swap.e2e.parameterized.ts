import { SwapTokens } from '../../../helpers/tokens'
import { warmup } from '../../../helpers/warmup'
import swapTabLoc from '../../../locators/swapTab.loc'
import commonElsPage from '../../../pages/commonEls.page'
import SwapTabPage from '../../../pages/swapTab.page'

describe('Swap Tokens', () => {
  const shuffled = [...SwapTokens].sort(() => 0.5 - Math.random())
  const firstTokens = shuffled.slice(0, 2)
  const secondTokens = shuffled.slice(2, 4)

  beforeEach(async () => {
    await warmup(true)
  })

  firstTokens.forEach(({ symbol }) => {
    test(`should swap AVAX to ${symbol}`, async () => {
      await SwapTabPage.swap(swapTabLoc.avaxSymbol, symbol)
      await commonElsPage.verifySuccessToast()
    })
  })

  secondTokens.forEach(({ symbol }) => {
    test(`should swap ${symbol} to AVAX`, async () => {
      await SwapTabPage.swap(symbol, swapTabLoc.avaxSymbol)
      await commonElsPage.verifySuccessToast()
    })
  })

  firstTokens.forEach((_, i) => {
    const from = firstTokens[i]?.symbol
    const to = secondTokens[i]?.symbol
    if (!from || !to) {
      throw new Error('From or to token is undefined')
    }
    test(`should swap ${from} to ${to}`, async () => {
      await SwapTabPage.swap(from, to)
      await commonElsPage.verifySuccessToast()
    })
  })
})
