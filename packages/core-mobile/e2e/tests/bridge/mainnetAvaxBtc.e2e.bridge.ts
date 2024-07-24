import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'

describe('Bridge transfer AVAX -> BTC', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Transaction Status Items', async () => {
    await BridgeTabPage.switchToNetwork('Avalanche')
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapBtcToken()
    await BridgeTabPage.inputTokenAmmountAvaxBtc()
    await BridgeTabPage.tapTransferButton()
    await BridgeTabPage.verifyBridgeItems(
      BridgeTabPage.avalancheNetwork,
      BridgeTabPage.bitcoinNetwork
    )
  }, 1800000)

  it('Should verify transaction succeeded', async () => {
    await BridgeTabPage.verifyBridgeTransaction(
      1800000,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.avaxBtcBridgeTransaction
    )
  }, 1800000)
})
