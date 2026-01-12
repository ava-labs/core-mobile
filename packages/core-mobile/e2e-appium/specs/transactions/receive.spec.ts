import warmup from '../../helpers/warmup'
import cl from '../../locators/commonEls.loc'
import txPage from '../../pages/transactions.page'

describe('[Smoke] Receive', () => {
  before(async () => {
    await warmup()
    await txPage.tapReceive()
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
        await txPage.selectNetwork(network)
      }
      await txPage.verifyReceiveScreen(network, address)
    })
  })
})
