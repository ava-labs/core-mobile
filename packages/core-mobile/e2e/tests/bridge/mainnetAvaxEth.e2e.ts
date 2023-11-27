import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'

describe('Bridge transfer AVAX -> ETH', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Transaction Status Items', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await BridgeTabPage.switchToNetwork('Avalanche')
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapWrappedEther()
    await BridgeTabPage.inputTokenAmmountAvaxEth()
    await BridgeTabPage.tapTransferButton()
    await BridgeTabPage.verifyBridgeItems(
      BridgeTabPage.avalancheNetwork,
      BridgeTabPage.ethereumNetwork
    )
  }, 1800000)

  it('Should verify transaction succeeded', async () => {
    await BridgeTabPage.verifyBridgeTransaction(
      1800000,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.avaxEthBridgeTransaction
    )
  }, 1800000)
})
