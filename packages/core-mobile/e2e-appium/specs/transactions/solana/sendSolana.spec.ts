import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('[Smoke] Send transaction', () => {
  it('should send SOL on Solana', async () => {
    // login & create account
    await warmup()
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
