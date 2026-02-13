import portfolioPage from '../../../pages/portfolio.page'
import commonElsPage from '../../../pages/commonEls.page'
import warmup from '../../../helpers/warmup'
import commonElsLoc from '../../../locators/commonEls.loc'

describe('Portfolio Assets', () => {
  const tokens = {
    avax: ['Send', 'Swap', 'Buy', 'Withdraw', 'Stake'],
    usdcCChain: ['Send', 'Swap', 'Buy', 'Bridge', 'Withdraw'],
    btc: ['Send', 'Buy', 'Withdraw'],
    eth: ['Send', 'Buy', 'Bridge', 'Withdraw'],
    usdcETH: ['Send', 'Buy', 'Bridge', 'Withdraw'],
    sol: ['Send', 'Swap', 'Buy', 'Withdraw'],
    orca: ['Send', 'Swap'],
    pchain: ['Send', 'Stake'],
    xchain: ['Send']
  }

  before(async () => {
    await warmup()
  })

  it('AVAX owned token detail', async () => {
    await commonElsPage.filter(commonElsLoc.cChain_2)
    await portfolioPage.verifyOwnedTokenDetail('Avalanche', tokens.avax)
  })

  it('USDC owned token detail', async () => {
    await portfolioPage.verifyOwnedTokenDetail('USDC', tokens.usdcCChain)
  })

  it('BTC owned token detail', async () => {
    await commonElsPage.filter(commonElsLoc.bitcoin)
    await portfolioPage.verifyOwnedTokenDetail('Bitcoin', tokens.btc)
  })

  it('ETH owned token detail', async () => {
    await commonElsPage.filter(commonElsLoc.ethereum)
    await portfolioPage.verifyOwnedTokenDetail('ETH', tokens.eth)
  })

  it('Ethereum ERC20 owned token detail', async () => {
    await portfolioPage.verifyOwnedTokenDetail('USD Coin', tokens.usdcETH)
  })

  it('SOL owned token detail', async () => {
    await commonElsPage.filter(commonElsLoc.solana)
    await portfolioPage.verifyOwnedTokenDetail('SOL', tokens.sol)
  })

  it('Solana SPL owned token detail', async () => {
    await portfolioPage.verifyOwnedTokenDetail('Orca', tokens.orca)
  })

  it('P-Chain owned token detail', async () => {
    await commonElsPage.filter(commonElsLoc.pChain)
    await portfolioPage.verifyOwnedTokenDetail(
      'Avalanche P-Chain',
      tokens.pchain
    )
  })

  it('X-Chain owned token detail', async () => {
    await commonElsPage.filter(commonElsLoc.xChain)
    await portfolioPage.verifyOwnedTokenDetail(
      'Avalanche X-Chain',
      tokens.xchain
    )
  })
})
