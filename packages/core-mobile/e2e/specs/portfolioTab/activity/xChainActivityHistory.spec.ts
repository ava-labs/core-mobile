import warmup from '../../../helpers/warmup'
import portfolio from '../../../pages/portfolio.page'
import settingsPage from '../../../pages/settings.page'
import settings from '../../../locators/settings.loc'
import txPage from '../../../pages/transactions.page'
import common from '../../../locators/commonEls.loc'
import commonPage from '../../../pages/commonEls.page'

describe('Activity history', () => {
  before(async () => {
    await warmup()
    await commonPage.filter(common.xChain)
    await portfolio.tapToken()
    // Send
    await txPage.send(undefined, '0.01')
    await txPage.verifySuccessToast()
  })

  it('[X-Chain Send] verify send history on the token detail', async () => {
    await portfolio.verifyXPSendOnTokenDetail('0.01 AVAX sent')
    await commonPage.goBack()
  })

  it('[X-Chain Send] verify send history on activity tab', async () => {
    await portfolio.verifyXPSendOnActivityTab('0.01 AVAX sent', common.xChain)
  })

  it('[X-Chain Receive] verify receive history on activity tab', async () => {
    await settingsPage.switchAccount(settings.account2)
    await portfolio.verifyXPSendOnActivityTab('0.01 AVAX received')
  })

  it('[X-Chain Receive] verify receive history on the token detail', async () => {
    await portfolio.tapAssetsTab()
    await portfolio.tapToken()
    await portfolio.verifyXPSendOnTokenDetail('0.01 AVAX received')
  })
})
