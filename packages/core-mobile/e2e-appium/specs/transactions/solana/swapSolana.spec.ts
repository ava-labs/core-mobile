import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Swap on Solana', () => {
  it('[Smoke] Should swap SOL to SPL', async () => {
    await warmup()
    await txPage.swapViaTokenDetail(txLoc.solana, 'SOL', 'USDC', '0.00001')
    await txPage.verifySuccessToast()
  })

  it('Should swap SPL to SOL', async () => {
    await txPage.swapViaTokenDetail(txLoc.solana, 'USDC', 'SOL', '0.0001')
    await txPage.verifySuccessToast()
  })

  it('Should swap SPL to SPL', async () => {
    await txPage.swapViaTokenDetail(txLoc.solana, 'USDC', 'JUP', '0.0001')
    await txPage.verifySuccessToast()
  })
})
