import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Swap on Solana', () => {
  it('Should swap SOL to SPL', async () => {
    await warmup()
    await txPage.swap('SOL', 'USDC', '0.00001', txLoc.solana)
    await txPage.verifySuccessToast()
  })

  it('Should swap SPL to SOL', async () => {
    await txPage.swap('USDC', 'SOL', '0.0001', txLoc.solana)
    await txPage.verifySuccessToast()
  })

  it('Should swap SPL to SPL', async () => {
    await txPage.swap('USDC', 'JUP', '0.0001', txLoc.solana)
    await txPage.verifySuccessToast()
  })
})
