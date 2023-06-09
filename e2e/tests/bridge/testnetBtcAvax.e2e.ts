/* eslint-disable jest/expect-expect */
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Bridge transfer testnet BTC -> AVAX', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Transaction Status Items', async () => {
    await AdvancedPage.switchToTestnet()
    await BridgeTabPage.switchToNetwork('Bitcoin')
    await BridgeTabPage.inputTokenAmmountBtcAvax()
    await BridgeTabPage.tapTransferButton()

    await BridgeTabPage.verifyBridgeItems(
      BridgeTabPage.avalancheNetwork,
      BridgeTabPage.bitcoinNetwork
    )
  }, 5000000)

  it('Should verify transaction succeeded', async () => {
    await BridgeTabPage.verifyBridgeTransaction(
      7200000,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.completedStatusBtcAvaxTestnet,
      BridgeTabPage.btcAvaxBridgeTransaction
    )
  }, 10000000)
})
