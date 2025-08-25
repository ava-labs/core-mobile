import assert from 'assert'
import actions from '../../../helpers/actions'
import { warmup } from '../../../helpers/warmup'
import portfolioLoc from '../../../locators/portfolio.loc'
import commonElsPage from '../../../pages/commonEls.page'
import manageTokensPage from '../../../pages/manageTokens.page'
import portfolioPage from '../../../pages/portfolio.page'

describe('Balance After Managing Token', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should deduct balance after hiding token on C-Chain', async () => {
    // Get balances before hiding token
    const fullBal = await portfolioPage.getTotalBalance()
    const activeNetworkBal = await portfolioPage.getActiveNetworkBalance()
    await portfolioPage.tapActiveNetwork()
    const networkTokensBal = await portfolioPage.getNetworkTokensBalance()
    const btcBal = await portfolioPage.getTokenBalance('BTC.b')

    // Hide token
    await actions.scrollToTop(portfolioPage.portfolioTokenList)
    await portfolioPage.tapManageTokens()
    await manageTokensPage.hideToken('Bitcoin')

    // Get balances after hiding token
    const newNetworkTokensBal = await portfolioPage.getNetworkTokensBalance()
    await commonElsPage.goBack()
    const newFullBal = await portfolioPage.getTotalBalance()
    const newActiveNetworkBal = await portfolioPage.getActiveNetworkBalance()
    const tolerance = 5

    // Log token balances before and after hiding token
    console.log(
      `Before: \nfullBal: ${fullBal}, \nbtcBal: ${btcBal}, \nactiveNetworkBal: ${activeNetworkBal} \nnetworkTotalBal: ${networkTokensBal}`
    )
    console.log(
      `After: \nnewFullBal: ${newFullBal}, \nnewActiveNetworkBal: ${newActiveNetworkBal} \nnewNetworkTotalBal: ${newNetworkTokensBal}`
    )

    // Assert that the tolerance is within the expected range
    const fullBalDiff = Math.abs(fullBal - btcBal - newFullBal)
    const networkTokensBalDiff = Math.abs(
      networkTokensBal - btcBal - newNetworkTokensBal
    )
    const activeNetworkBalDiff = Math.abs(
      activeNetworkBal - btcBal - newActiveNetworkBal
    )
    assert(fullBalDiff < tolerance, `${fullBalDiff} !< ${tolerance}`)
    assert(
      networkTokensBalDiff < tolerance,
      `${networkTokensBalDiff} !< ${tolerance}`
    )
    assert(
      activeNetworkBalDiff < tolerance,
      `${activeNetworkBalDiff} !< ${tolerance}`
    )
  })

  it('should deduct balance after hiding token on Ethereum', async () => {
    // Get balances before hiding token
    const fullBal = await portfolioPage.getTotalBalance()
    const activeNetworkBal = await portfolioPage.getActiveNetworkBalance()
    await portfolioPage.tapActiveNetwork(portfolioLoc.ethNetwork)
    const networkTokensBal = await portfolioPage.getNetworkTokensBalance(
      portfolioLoc.ethNetwork
    )
    const wethBal = await portfolioPage.getTokenBalance('WETH')

    // Hide token
    await actions.scrollToTop(portfolioPage.portfolioTokenList)
    await portfolioPage.tapManageTokens()
    await manageTokensPage.hideToken('Wrapped Ether')

    // Get balances after hiding token
    const newNetworkTokensBal = await portfolioPage.getNetworkTokensBalance(
      portfolioLoc.ethNetwork
    )
    await commonElsPage.goBack()
    const newFullBal = await portfolioPage.getTotalBalance()
    const newActiveNetworkBal = await portfolioPage.getActiveNetworkBalance()
    const tolerance = 5

    // Log token balances before and after hiding token
    console.log(
      `Before: \nfullBal: ${fullBal}, \nbtcBal: ${wethBal}, \nactiveNetworkBal: ${activeNetworkBal} \nnetworkTotalBal: ${networkTokensBal}`
    )
    console.log(
      `After: \nnewFullBal: ${newFullBal}, \nnewActiveNetworkBal: ${newActiveNetworkBal} \nnewNetworkTotalBal: ${newNetworkTokensBal}`
    )

    // Assert that the tolerance is within the expected range
    const fullBalDiff = Math.abs(fullBal - wethBal - newFullBal)
    const networkTokensBalDiff = Math.abs(
      networkTokensBal - wethBal - newNetworkTokensBal
    )
    const activeNetworkBalDiff = Math.abs(
      activeNetworkBal - wethBal - newActiveNetworkBal
    )
    assert(fullBalDiff < tolerance, `${fullBalDiff} !< ${tolerance}`)
    assert(
      networkTokensBalDiff < tolerance,
      `${networkTokensBalDiff} !< ${tolerance}`
    )
    assert(
      activeNetworkBalDiff < tolerance,
      `${activeNetworkBalDiff} !< ${tolerance}`
    )
  })

  it('should update balance after showing token on Ethereum', async () => {
    // Get balances before showing token
    const fullBal = await portfolioPage.getTotalBalance()
    const activeNetworkBal = await portfolioPage.getActiveNetworkBalance()
    await portfolioPage.tapActiveNetwork(portfolioLoc.ethNetwork)
    const networkTokensBal = await portfolioPage.getNetworkTokensBalance(
      portfolioLoc.ethNetwork
    )

    // Show token
    await actions.scrollToTop(portfolioPage.portfolioTokenList)
    await portfolioPage.tapManageTokens()
    await manageTokensPage.showToken('Wrapped Ether')

    // Get balances after hiding token
    const newNetworkTokensBal = await portfolioPage.getNetworkTokensBalance(
      portfolioLoc.ethNetwork
    )
    const wethBal = await portfolioPage.getTokenBalance('WETH')
    await commonElsPage.goBack()
    const newFullBal = await portfolioPage.getTotalBalance()
    const newActiveNetworkBal = await portfolioPage.getActiveNetworkBalance()
    const tolerance = 5

    // Log token balances before and after hiding token
    console.log(
      `Before: \nfullBal: ${fullBal}, \nactiveNetworkBal: ${activeNetworkBal} \nnetworkTotalBal: ${networkTokensBal}`
    )
    console.log(
      `After: \nnewFullBal: ${newFullBal}, \nwethBal: ${wethBal}, \nnewActiveNetworkBal: ${newActiveNetworkBal} \nnewNetworkTotalBal: ${newNetworkTokensBal}`
    )

    // Assert that the tolerance is within the expected range
    const fullBalDiff = Math.abs(fullBal + wethBal - newFullBal)
    const networkTokensBalDiff = Math.abs(
      networkTokensBal + wethBal - newNetworkTokensBal
    )
    const activeNetworkBalDiff = Math.abs(
      activeNetworkBal + wethBal - newActiveNetworkBal
    )
    assert(fullBalDiff < tolerance, `${fullBalDiff} !< ${tolerance}`)
    assert(
      networkTokensBalDiff < tolerance,
      `${networkTokensBalDiff} !< ${tolerance}`
    )
    assert(
      activeNetworkBalDiff < tolerance,
      `${activeNetworkBalDiff} !< ${tolerance}`
    )
  })

  it('should update balance after showing token on C-Chain', async () => {
    // Get balances before showing token
    const fullBal = await portfolioPage.getTotalBalance()
    const activeNetworkBal = await portfolioPage.getActiveNetworkBalance()
    await portfolioPage.tapActiveNetwork()
    const networkTokensBal = await portfolioPage.getNetworkTokensBalance()

    // Show token
    await actions.scrollToTop(portfolioPage.portfolioTokenList)
    await portfolioPage.tapManageTokens()
    await manageTokensPage.showToken('Bitcoin')

    // Get balances after hiding token
    const newNetworkTokensBal = await portfolioPage.getNetworkTokensBalance()
    const btcBal = await portfolioPage.getTokenBalance('BTC.b')
    await commonElsPage.goBack()
    const newFullBal = await portfolioPage.getTotalBalance()
    const newActiveNetworkBal = await portfolioPage.getActiveNetworkBalance()
    const tolerance = 5

    // Log token balances before and after hiding token
    console.log(
      `Before: \nfullBal: ${fullBal}, \nbtcBal: ${btcBal}, \nactiveNetworkBal: ${activeNetworkBal} \nnetworkTotalBal: ${networkTokensBal}`
    )
    console.log(
      `After: \nnewFullBal: ${newFullBal}, \nnewActiveNetworkBal: ${newActiveNetworkBal} \nnewNetworkTotalBal: ${newNetworkTokensBal}`
    )

    // Assert that the tolerance is within the expected range
    const fullBalDiff = Math.abs(fullBal + btcBal - newFullBal)
    const networkTokensBalDiff = Math.abs(
      networkTokensBal + btcBal - newNetworkTokensBal
    )
    const activeNetworkBalDiff = Math.abs(
      activeNetworkBal + btcBal - newActiveNetworkBal
    )
    assert(fullBalDiff < tolerance, `${fullBalDiff} !< ${tolerance}`)
    assert(
      networkTokensBalDiff < tolerance,
      `${networkTokensBalDiff} !< ${tolerance}`
    )
    assert(
      activeNetworkBalDiff < tolerance,
      `${activeNetworkBalDiff} !< ${tolerance}`
    )
  })
})
