import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Swap on Solana', () => {
  it('[Smoke] Should swap SOL to SPL', async () => {
    await warmup()
    await txPage.swap('SOL', 'USDC', '0.0001', txLoc.solana)
    await txPage.verifySuccessToast()
  })

  it('Should swap SPL to SOL', async () => {
    await txPage.swap('USDC', 'SOL', '0.001', txLoc.solana)
    await txPage.verifySuccessToast()
  })

  it('Should swap SPL to SPL', async () => {
    await txPage.swap('USDC', 'JUP', '0.001', txLoc.solana)
    await txPage.verifySuccessToast()
  })
})
