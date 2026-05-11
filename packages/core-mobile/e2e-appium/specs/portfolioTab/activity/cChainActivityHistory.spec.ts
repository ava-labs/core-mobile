import warmup from '../../../helpers/warmup'
import portfolio from '../../../pages/portfolio.page'
import settingsPage from '../../../pages/settings.page'
import settings from '../../../locators/settings.loc'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'
import common from '../../../locators/commonEls.loc'
import commonPage from '../../../pages/commonEls.page'

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

    await txPage.tapSwap()
    await txPage.quickSwap('0.02')
    await txPage.verifySuccessToast()
  })

  it('[C-Chain Send] verify send history on activity tab', async () => {
    await portfolio.verifySendOnActivityTab(common.cChain_2, '0.01 AVAX sent')
    await portfolio.verifyActivityNotVisible('0.0001 AVAX sent')
  })

  it('[C-Chain Swap] verify swap history on activity tab', async () => {
    await portfolio.verifySwapActivityHistory('0.02 AVAX swapped for')
  })

  it('[C-Chain Send] verify send history on the token detail', async () => {
    await portfolio.verifySendOnTokenDetail(
      common.cChain_2,
      txLoc.avalanche,
      '0.01 AVAX sent'
    )
    await portfolio.verifyActivityNotVisible('0.0001 AVAX sent')
  })

  it('[C-Chain Swap] verify swap history on the token detail', async () => {
    await portfolio.verifySwapActivityHistory('0.02 AVAX swapped for')
    await commonPage.goBack()
  })

  it('[C-Chain Receive] verify receive history on activity tab', async () => {
    await settingsPage.switchAccount(settings.account2)
    await portfolio.verifySendOnActivityTab(
      common.cChain_2,
      '0.01 AVAX received'
    )
    await portfolio.verifyActivityNotVisible('0.0001 AVAX received')
  })

  it('[C-Chain Receive] verify receive history on the token detail activity', async () => {
    await portfolio.verifySendOnTokenDetail(
      common.cChain_2,
      txLoc.avalanche,
      '0.01 AVAX received'
    )
    await portfolio.verifyActivityNotVisible('0.0001 AVAX received')
  })
})
