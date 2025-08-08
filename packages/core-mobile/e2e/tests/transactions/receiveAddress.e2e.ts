import { warmup } from '../../helpers/warmup'
import receivePage from '../../pages/receive.page'
import cl from '../../locators/commonEls.loc'
import portfolioPage from '../../pages/portfolio.page'

describe('Receive Address', () => {
  beforeAll(async () => {
    await warmup()
    await portfolioPage.tapReceive()
  })

  const networkAndAddress: Record<string, string> = {
    [cl.evm]: cl.myEvmAddress,
    [cl.xpChain]: cl.myXpAddress,
    [cl.bitcoin]: cl.myBtcAddress,
    [cl.solana]: cl.mySolanaAddress
  }

  Object.entries(networkAndAddress).forEach(([network, address]) => {
    it(`should verify ${network} address`, async () => {
      if (network !== cl.evm) {
        await receivePage.selectNetwork(network)
      }
      await receivePage.verifyReceiveScreen(network, address)
    })
  })
})
