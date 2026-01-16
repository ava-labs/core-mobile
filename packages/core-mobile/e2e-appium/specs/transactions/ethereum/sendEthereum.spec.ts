import warmup from '../../../helpers/warmup'

import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('[Smoke] Send transaction', () => {
  it('should send ETH on Ethereum', async () => {
    // login & create account
    await warmup()
    // Send
    await txPage.send(txLoc.ethToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })

  it('should send ERC20 on Ethereum', async () => {
    // Send
    await txPage.send(txLoc.wethToken, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
