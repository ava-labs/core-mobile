import warmup from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Send transaction', () => {
  before(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('should send SPL on Solana', async () => {
    await txPage.send(txLoc.jupToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
