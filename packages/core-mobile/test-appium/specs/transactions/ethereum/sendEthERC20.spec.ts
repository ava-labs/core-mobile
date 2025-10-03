import warmup from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Send transaction', () => {
  before(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('should send ERC20 on Ethereum', async () => {
    await txPage.send(txLoc.wethToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
