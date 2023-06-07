/* eslint-disable jest/expect-expect */
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BridgeTabPage from '../../pages/bridgeTab.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Bridge transfer testnet AVAX -> BTC', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Transaction Status Items', async () => {
    await AdvancedPage.switchToTestnet()
    await BridgeTabPage.switchToNetwork('Avalanche')
    await BridgeTabPage.tapSelectTokenDropdown()
    await BridgeTabPage.tapBtcToken()
    await BridgeTabPage.inputTokenAmmountAvaxBtc()
    await BridgeTabPage.tapTransferButton()

    await BridgeTabPage.verifyBridgeItems(
      BridgeTabPage.avalancheNetwork,
      BridgeTabPage.bitcoinNetwork
    )
  }, 5000000)

  it('Should verify transaction succeeded', async () => {
    await BridgeTabPage.verifyBridgeTransaction(
      1800000,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.completedStatusAvax,
      BridgeTabPage.avaxBtcBridgeTransaction
    )
  }, 1800000)
})
