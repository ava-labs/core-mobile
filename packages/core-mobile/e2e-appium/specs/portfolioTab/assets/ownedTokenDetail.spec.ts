import portfolioPage from '../../../pages/portfolio.page'
import commonElsPage from '../../../pages/commonEls.page'
import warmup from '../../../helpers/warmup'
import commonElsLoc from '../../../locators/commonEls.loc'
import bottomTabsPage from '../../../pages/bottomTabs.page'

describe('Portfolio tab', () => {
  const tokens: Record<string, string[]> = {
    avax: ['Send', 'Swap', 'Buy', 'Withdraw', 'Stake'],
    usdcCChain: ['Send', 'Swap', 'Buy', 'Bridge', 'Withdraw'],
    btc: ['Send', 'Buy', 'Bridge', 'Withdraw'],
    eth: ['Send', 'Buy', 'Bridge', 'Withdraw'],
    usdcETH: ['Send', 'Buy', 'Bridge', 'Withdraw'],
    sol: ['Send', 'Swap', 'Buy', 'Withdraw'],
    orca: ['Send', 'Swap'],
    pchain: ['Send', 'Stake'],
    xchain: ['Send']
  }

  it('Assets - AVAX owned token detail', async () => {
    await warmup()
    await bottomTabsPage.tapPortfolioTab()
    await commonElsPage.filter(commonElsLoc.cChain_2)
    await portfolioPage.verifyOwnedTokenDetail('Avalanche', tokens.avax || [])
  })

  it('Assets - USDC owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.verifyOwnedTokenDetail('USDC', tokens.usdcCChain || [])
  })

  it('Assets - BTC owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await commonElsPage.filter(commonElsLoc.bitcoin)
    await portfolioPage.verifyOwnedTokenDetail('Bitcoin', tokens.btc || [])
  })

  it('Assets - ETH owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await commonElsPage.filter(commonElsLoc.ethereum)
    await portfolioPage.verifyOwnedTokenDetail('ETH', tokens.eth || [])
  })

  it('Assets - ETH ERC20 owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.verifyOwnedTokenDetail('USD Coin', tokens.usdcETH || [])
  })

  it('Assets - SOL owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await commonElsPage.filter(commonElsLoc.solana)
    await portfolioPage.verifyOwnedTokenDetail('SOL', tokens.sol || [])
  })

  it('Assets - SPL owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.verifyOwnedTokenDetail('Orca', tokens.orca || [])
  })

  it('Assets - P-Chain owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await commonElsPage.filter(commonElsLoc.pChain)
    await portfolioPage.verifyOwnedTokenDetail('Avalanche', tokens.pchain || [])
  })

  it('Assets - X-Chain owned token detail', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await commonElsPage.filter(commonElsLoc.xChain)
    await portfolioPage.verifyOwnedTokenDetail('Avalanche', tokens.xchain || [])
  })
})
