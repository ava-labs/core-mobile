import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'
import commonPage from '../../../pages/commonEls.page'

describe('Earn', () => {
  it('should borrow AVAX', async () => {
    await warmup()
    await earnPage.deposit('aave', 'AVAX', '0.0001')
    await earnPage.borrow()
  })

  it('should verify borrow detail', async () => {
    await earnPage.tapBorrowCard()
    await earnPage.verifyBorrowDetail()
    await commonPage.goBack()
  })

  it('should repay max amount', async () => {
    await earnPage.repay()
  })
})
