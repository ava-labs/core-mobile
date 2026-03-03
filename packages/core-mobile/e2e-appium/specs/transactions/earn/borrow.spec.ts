import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'

describe('[Smoke] Earn', () => {
  const randomPool = Math.random() < 0.5 ? 'aave' : 'benqi'

  it('should borrow AVAX', async () => {
    await warmup()
    await earnPage.borrow('AVAX', randomPool)
  })

  it('should borrow ERC20', async () => {
    await earnPage.borrow('USDC', randomPool)
  })

  it('should verify borrow detail', async () => {
    await earnPage.tapBorrowCard('AVAX', randomPool)
    await earnPage.verifyBorrowDetail('AVAX', randomPool)
  })

  it('should repay max amount', async () => {
    await earnPage.repay(randomPool)
  })
})
