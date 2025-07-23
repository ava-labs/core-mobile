import { warmup } from '../../../../helpers/warmup'
import sendLoc from '../../../../locators/send.loc'
import commonElsPage from '../../../../pages/commonEls.page'
import sendPage from '../../../../pages/send.page'
import settingsPage from '../../../../pages/settings.page'

describe('Send on Solana network', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('Should send SOL on Solana network', async () => {
    await sendPage.send(sendLoc.ethToken, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })

  it('Should send JUP on Solana  network', async () => {
    await sendPage.send(sendLoc.wethToken, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })
})
