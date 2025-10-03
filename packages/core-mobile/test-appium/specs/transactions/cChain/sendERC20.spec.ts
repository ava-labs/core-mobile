import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Send transaction', () => {
  it('should send ERC20 on C-Chain', async () => {
    // login & create account
    await warmup(true)

    // Send
    await txPage.send(txLoc.coqInu, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
