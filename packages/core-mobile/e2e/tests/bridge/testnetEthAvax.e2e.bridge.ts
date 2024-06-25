import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Bridge transfer testnet ETH -> AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Transaction Status Items', async () => {
    await AdvancedPage.switchToTestnet()
    await BridgeTabPage.switchToNetwork('Ethereum')
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapWrappedEther()
    await BridgeTabPage.inputTokenAmmountEthAvax()
    await BridgeTabPage.tapTransferButton()
    await BridgeTabPage.verifyBridgeItems(
      BridgeTabPage.avalancheNetwork,
      BridgeTabPage.ethereumNetwork
    )
  }, 1800000)

  it('Should verify transaction succeeded', async () => {
    await BridgeTabPage.verifyBridgeTransaction(
      1800000,
      BridgeTabPage.completedStatusEth,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.ethBridgeTransaction
    )
  }, 1800000)
})
