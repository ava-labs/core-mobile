import { warmup } from '../../../../helpers/warmup'
import portfolioLoc from '../../../../locators/portfolio.loc'
import bridgePage from '../../../../pages/bridge.page'
import cl from '../../../../locators/commonEls.loc'

// Please note that the tests here are NOT for completing the bridge transactions,
// but for verifying the bridge screen and its elements'
// Since Bridge Transactions are expensive, we are just testing the flow between networks on e2e daily run.
// we can add `true` to bridgePage.bridge() to complete the bridge transaction.
describe('Bridge from C-Chain', () => {
  beforeAll(async () => {
    await warmup()
  })

  const networks = [
    {
      network: portfolioLoc.ethNetwork,
      token: 'USDC',
      amount: '18',
      tokenAddress: cl.usdcAddress
    },
    {
      network: portfolioLoc.btcNetwork,
      token: 'BTC.b',
      amount: '0.0005',
      tokenAddress: cl.btcbAddress
    }
  ]

  // C-Chain > Bridge to other networks
  networks.forEach(({ network, token, amount, tokenAddress }) => {
    it(`should bridge from C-Chain to ${network}`, async () => {
      // Avalanche > Select token with Max amount
      await bridgePage.bridge(cl.cChain_2, token, amount, tokenAddress)
    })
  })
})
