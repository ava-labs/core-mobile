import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'

describe('[Smoke] Earn Deposit', () => {
  const randomPool = Math.random() < 0.5 ? 'aave' : 'benqi'

  it('should deposit AVAX', async () => {
    await warmup()
    await earnPage.deposit('AVAX', '0.0001', randomPool)
  })

  // it('should deposit ERC20', async () => {
  //   await earnPage.deposit('USDC', '0.0001', randomPool)
  // })

  it('should withdraw max amount from deposit', async () => {
    await earnPage.withdraw('max', randomPool)
  })
})
