import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Bridge transfer testnet AVAX -> ETH', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Transaction Status Items', async () => {
    await AdvancedPage.switchToTestnet()
    await BridgeTabPage.switchToNetwork('Avalanche')
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapWrappedEther()
    await BridgeTabPage.inputTokenAmmountAvaxEth()
    await BridgeTabPage.tapTransferButton()
    await BridgeTabPage.verifyBridgeItems(
      BridgeTabPage.avalancheNetwork,
      BridgeTabPage.ethereumNetwork
    )
  }, 5000000)

  it('Should verify transaction succeeded', async () => {
    await BridgeTabPage.verifyBridgeTransaction(
      1800000,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.avaxEthBridgeTransaction
    )
  }, 1800000)
})
