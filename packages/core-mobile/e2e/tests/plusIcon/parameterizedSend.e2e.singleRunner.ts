import AccountManagePage from '../../pages/accountManage.page'
import sendPage from '../../pages/send.page'
import { warmup } from '../../helpers/warmup'
import { Tokens } from '../../helpers/tokens'
import actions from '../../helpers/actions'
import commonElsPage from '../../pages/commonEls.page'

describe('Send parameterized tokens', () => {
  beforeAll(async () => {
    await warmup()
    await AccountManagePage.createSecondAccount()
  })

  Tokens.forEach(async ({ symbol }) => {
    test(`should send ${symbol}`, async () => {
      await commonElsPage.refreshApp()
      await sendPage.sendTokenTo2ndAccount(symbol, '0.00001')
      await actions.waitForElementNotVisible(sendPage.sendTitle)
      await sendPage.verifySuccessToast()
      console.log(`${symbol}: Transaction Successful`)
    })
  })
})
