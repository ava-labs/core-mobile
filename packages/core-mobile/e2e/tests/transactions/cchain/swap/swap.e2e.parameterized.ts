import actions from '../../../../helpers/actions'
import { SwapTokens } from '../../../../helpers/tokens'
import { warmup } from '../../../../helpers/warmup'
import swapTabLoc from '../../../../locators/swapTab.loc'
import SendPage from '../../../../pages/send.page'
import SwapTabPage from '../../../../pages/swapTab.page'

describe('Swap AVAX to Parameterized Tokens', () => {
  beforeEach(async () => {
    const newInstance = actions.platform() === 'android' ? true : false
    await warmup(newInstance)
  })

  // Swap AVAX to ERC20. We're testing two tokens
  SwapTokens.sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .forEach(({ symbol }) => {
      test(`should swap AVAX to ${symbol}`, async () => {
        await SwapTabPage.swap(swapTabLoc.avaxSymbol, symbol)
        await SendPage.verifySuccessToast()
        console.log(`${symbol}: Swap Transaction Successful`)
      })
    }, 120000)

  // Swap ERC20 to AVAX. We're testing two tokens
  SwapTokens.sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .forEach(({ symbol }) => {
      test(`should swap ${symbol} to AVAX`, async () => {
        await SwapTabPage.swap(symbol, swapTabLoc.avaxSymbol)
        await SendPage.verifySuccessToast()
        console.log(`${symbol}: Swap Transaction Successful`)
      })
    }, 120000)

  const randomSixTokens = SwapTokens.sort(() => 0.5 - Math.random()).slice(0, 4)
  const firstHalf = randomSixTokens.slice(0, 2)
  const secondHalf = randomSixTokens.slice(2, 4)

  // Swap ERC20 to ERC20. We're testing two tokens
  firstHalf.forEach((item, index) => {
    const firstToken = item
    const secondToken = secondHalf[index] || { symbol: 'AVAX' }
    test(`should swap ${firstToken.symbol} to ${secondToken.symbol}`, async () => {
      await SwapTabPage.swap(firstToken.symbol, secondToken.symbol)
      await SendPage.verifySuccessToast()
      console.log(`${firstToken.symbol}: Swap Transaction Successful`)
    })
  }, 120000)
})
