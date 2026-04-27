import warmup from '../../../helpers/warmup'
import portfolioPage from '../../../pages/portfolio.page'
import settingsPage from '../../../pages/settings.page'
import settings from '../../../locators/settings.loc'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'

describe('Activity history', () => {
  before(async () => {
    await warmup()
    // 0.0001 AVAX is below the C-Chain low-value filter threshold (0.001 AVAX / $0.01 USD)
    // — should be filtered out and NOT appear in activity
    await txPage.send(txLoc.avaxToken, '0.0001')
    await txPage.verifySuccessToast()
    // 0.01 AVAX is above the threshold — should appear in activity
    await txPage.send(txLoc.avaxToken, '0.01')
    await txPage.verifySuccessToast()
  })

  it('should verify the send history on activity tab', async () => {
    await portfolioPage.verifyTxOnActivityTab(
      '0.01 AVAX sent',
      '0.0001 AVAX sent'
    )
  })

  it('should verify the send history on the token detail activity', async () => {
    await portfolioPage.verifyTxOnTokenDetail(
      '0.01 AVAX sent',
      '0.0001 AVAX sent'
    )
  })

  it('should verify the receive history on activity tab', async () => {
    await settingsPage.switchAccount(settings.account2)
    await portfolioPage.verifyTxOnActivityTab(
      '0.01 AVAX received',
      '0.0001 AVAX received'
    )
  })

  it('should verify the receive history on the token detail activity', async () => {
    await portfolioPage.verifyTxOnTokenDetail(
      '0.01 AVAX received',
      '0.0001 AVAX received'
    )
  })
})
