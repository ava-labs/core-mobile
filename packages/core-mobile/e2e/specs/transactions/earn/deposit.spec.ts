import warmup from '../../../helpers/warmup'
import earnPage from '../../../pages/earn.page'
import commonPage from '../../../pages/commonEls.page'

const pools = ['aave', 'benqi'] as const

pools.forEach(pool => {
  describe(`Earn deposit (${pool})`, () => {
    it(`should deposit AVAX to ${pool}`, async () => {
      await warmup()
      await earnPage.deposit(pool, 'AVAX', '0.0001')
    })

    it(`should verify ${pool} deposit detail`, async () => {
      await earnPage.tapDepositCard(pool, 'AVAX')
      await earnPage.verifyDepositDetail('AVAX', pool)
      await commonPage.goBack()
    })

    it(`should withdraw max amount from ${pool}`, async () => {
      await earnPage.withdraw(pool, 'AVAX', 'max')
    })
  })
})
