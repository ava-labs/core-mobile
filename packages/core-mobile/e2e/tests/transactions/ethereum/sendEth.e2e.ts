import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import commonElsPage from '../../../pages/commonEls.page'
import sendPage from '../../../pages/send.page'
import settingsPage from '../../../pages/settings.page'

describe('Send on Ethereum network', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('Should send Eth on Ethereum network', async () => {
    await sendPage.send(sendLoc.ethToken, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })

  it('Should send ERC20 on Ethereum network', async () => {
    await sendPage.send(sendLoc.wethToken, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })
})
