import warmup from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Send ERC20 on C-Chain', () => {
  before(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('should send ERC20 on C-Chain', async () => {
    await txPage.send(txLoc.usdcToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
