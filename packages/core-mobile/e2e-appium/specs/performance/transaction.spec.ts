import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import txPage from '../../pages/transactions.page'
import txLoc from '../../locators/transactions.loc'
import commonElsPage from '../../pages/commonEls.page'

describe('[Performance] Transaction', () => {
  before(async () => {
    await warmup()
  })

  it('Send performance on C-Chain', async () => {
    const start = await txPage.send(txLoc.avaxToken, txLoc.sendingAmount)
    await actions.isNotVisible(commonElsPage.grabber)
    await actions.assertPerformance(start)
  })
})
