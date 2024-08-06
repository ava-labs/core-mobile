import AccountManagePage from '../../pages/accountManage.page'
import sendPage from '../../pages/send.page'
import { warmup } from '../../helpers/warmup'
import { Tokens } from '../../helpers/tokens'
import popUpModalPage from '../../pages/popUpModal.page'
import actions from '../../helpers/actions'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'

describe('Send parameterized tokens', () => {
  beforeAll(async () => {
    await warmup()
    await AccountManagePage.createSecondAccount()
  })

  Tokens.forEach(async ({ symbol }) => {
    test(`should send ${symbol}`, async () => {
      if (device.getPlatform() === 'android') {
        await device.launchApp({ newInstance: true })
      } else {
        await device.reloadReactNative()
      }
      await loginRecoverWallet.enterPin()
      await sendPage.sendTokenTo2ndAccount(symbol, '0.00001')
    })
    await actions.waitForElementNotVisible(sendPage.sendTitle)
    await actions.waitForElement(popUpModalPage.successfulToastMsg, 120000)
    console.log(`${symbol}: Transaction Successful`)
  })
})
