import actions from '../../../../helpers/actions'
import { Tokens } from '../../../../helpers/tokens'
import { warmup } from '../../../../helpers/warmup'
import settingsPage from '../../../../pages/settings.page'
import sendPage from '../../../../pages/send.page'
import commonElsPage from '../../../../pages/commonEls.page'

describe('Send ERC20', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  beforeEach(async () => {
    const newInstance = actions.platform() === 'android' ? true : false
    await warmup(newInstance)
  })

  Tokens.forEach(({ symbol, amount }) => {
    test(`should send ${symbol}`, async () => {
      await sendPage.send(symbol, amount)
      await commonElsPage.verifySuccessToast()
      console.log(`${symbol}: Transaction Successful`)
    })
  })
})
