import warmup, { restartAndUnlock } from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import txPage from '../../../pages/transactions.page'

describe('Swap on C-Chain', () => {
  before(async () => {
    await warmup()
  })

  after(async () => {
    await restartAndUnlock()
    await settingsPage.quickSwapOn(false)
  })

  it('Should perform a quick swap', async () => {
    // Enable Quick swaps in Account Settings > Advanced settings
    await settingsPage.quickSwapOn()

    // Open the Swap screen (defaults to AVAX → USDC on C-Chain)
    await txPage.tapSwap()

    // Enter amount, set slippage to 2%, then tap Next
    await txPage.quickSwapNoApprove('0.01')

    // Assert no approve popup appeared and swap screen dismissed on success
    await txPage.verifyQuickSwapSuccess()
  })
})
