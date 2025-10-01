import warmup from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Send ETH on Ethereum', () => {
  before(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('should send ETH on Ethereum', async () => {
    await txPage.send(txLoc.avaxToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
