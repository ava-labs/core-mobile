/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'

describe('Bridge transfer BTC -> AVAX', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Transaction Status Items', async () => {
    await BridgeTabPage.switchToNetwork('Bitcoin')
    await BridgeTabPage.inputTokenAmmountBtcAvax()
    await Assert.isNotVisible(BridgeTabPage.amountToLowBtcAvaxMessage)
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
      BridgeTabPage.completedStatusBtcAvaxMainnet,
      BridgeTabPage.btcAvaxBridgeTransaction
    )
  }, 10000000)
})
