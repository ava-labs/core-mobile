import warmup from '../helpers/warmup'
import settingsPage from '../pages/settings.page'
import txPage from '../pages/transactions.page'
import txLoc from '../locators/transactions.loc'

describe('appium discovery', () => {
  it('onboarding flow', async () => {
    await warmup()
  })

  it('create account flow', async () => {
    await settingsPage.createNthAccount()
  })

  it('should send AVAX', async () => {
    await txPage.send(txLoc.avaxToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
