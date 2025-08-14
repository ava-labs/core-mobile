import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import commonElsPage from '../../../pages/commonEls.page'
import sendPage from '../../../pages/send.page'
import settingsPage from '../../../pages/settings.page'

describe('Send on Solana network', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('Should send SOL on Solana network', async () => {
    await sendPage.send(sendLoc.solToken, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast(60000)
  })

  it('Should send JUP on Solana network', async () => {
    await sendPage.send(sendLoc.jupToken, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast(60000)
  })
})
