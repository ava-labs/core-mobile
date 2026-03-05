import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'
import commonPage from '../../../pages/commonEls.page'

describe('Earn', () => {
  const randomPool = Math.random() < 0.5 ? 'aave' : 'benqi'

  it('[Smoke] should deposit AVAX', async () => {
    await warmup()
    await earnPage.deposit(randomPool, 'AVAX', '0.0001')
  })

  it('should verify deposit detail', async () => {
    await earnPage.tapDepositCard(randomPool, 'AVAX')
    await earnPage.verifyDepositDetail('AVAX', randomPool)
    await commonPage.goBack()
  })

  it('should withdraw max amount', async () => {
    await earnPage.withdraw(randomPool, 'AVAX', 'max')
  })
})
