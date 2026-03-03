import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'

describe('[Smoke] Earn', () => {
  const randomPool = Math.random() < 0.5 ? 'aave' : 'benqi'

  it('should deposit AVAX', async () => {
    await warmup()
    await earnPage.deposit('AVAX', '0.0001', randomPool)
  })

  it('should deposit ERC20', async () => {
    await earnPage.deposit('USDC', '0.0001', randomPool)
  })

  it('should verify deposit detail', async () => {
    await earnPage.tapDepositCard('AVAX', randomPool)
    await earnPage.verifyDepositDetail('AVAX', randomPool)
  })

  it('should withdraw max amount', async () => {
    await earnPage.withdraw('max', randomPool)
  })
})
