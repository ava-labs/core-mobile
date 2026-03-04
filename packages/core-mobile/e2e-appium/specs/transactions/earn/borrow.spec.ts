import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'
import commonPage from '../../../pages/commonEls.page'

describe('Earn', () => {
  it('[Smoke] should borrow AVAX', async () => {
    await warmup()
    await earnPage.borrow()
  })

  it('should verify borrow detail', async () => {
    await earnPage.tapBorrowCard()
    await earnPage.verifyBorrowDetail()
    await commonPage.goBack()
  })

  it('[Smoke] should repay max amount', async () => {
    await earnPage.repay()
  })
})
