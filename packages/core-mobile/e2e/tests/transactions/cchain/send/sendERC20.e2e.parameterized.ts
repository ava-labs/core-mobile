import actions from '../../../../helpers/actions'
import { Tokens } from '../../../../helpers/tokens'
import { warmup } from '../../../../helpers/warmup'
import accountManagePage from '../../../../pages/accountManage.page'
import sendPage from '../../../../pages/send.page'

describe('Send ERC20', () => {
  beforeAll(async () => {
    await warmup()
    await accountManagePage.createSecondAccount()
  })

  beforeEach(async () => {
    const newInstance = actions.platform() === 'android' ? true : false
    await warmup(newInstance)
  })

  Tokens.forEach(({ symbol, amount }) => {
    test(`should send ${symbol}`, async () => {
      await sendPage.sendTokenTo2ndAccount(symbol, amount)
      await actions.waitForElementNotVisible(sendPage.sendTitle)
      await sendPage.verifySuccessToast()
      console.log(`${symbol}: Transaction Successful`)
    })
  })
})
