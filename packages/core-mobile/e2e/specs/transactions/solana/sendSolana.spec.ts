import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Send transaction', () => {
  before(async () => {
    await warmup()
  })

  it('[Smoke] should send SOL on Solana', async () => {
    // Send
    await txPage.send(txLoc.solToken, txLoc.solSendingAmount)
    await txPage.verifySuccessToast()
  })

  it('should send SPL on Solana', async () => {
    // Send
    await txPage.send(txLoc.jupToken, txLoc.solSendingAmount)
    await txPage.verifySuccessToast()
  })
})
