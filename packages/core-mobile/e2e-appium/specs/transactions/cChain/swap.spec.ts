import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'

describe('Swap on C-Chain', () => {
  it('Should swap AVAX to ERC20', async () => {
    await warmup()
    await txPage.swap('AVAX', 'USDC', '0.00001')
    await txPage.verifySuccessToast()
  })

  it('Should swap ERC20 to AVAX', async () => {
    await txPage.swap('USDC', 'AVAX', '0.0001')
    await txPage.verifySuccessToast()
  })

  it('Should swap ERC20 to ERC20', async () => {
    await txPage.swap('USDC', 'USDT', '0.0001')
    await txPage.verifySuccessToast()
  })
})
