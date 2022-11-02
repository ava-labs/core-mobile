/* eslint-env detox/detox, jest */
import { by, expect, element, device } from 'detox'
import WatchListPage from './pages/watchlist.page'
import Assert from './helpers/assertions'
import RecoveryPhrasePage from './pages/recoveryPhrase.page'
import CreatePinPage from './pages/createPin.page'
import AnalyticsConsentPage from './pages/analyticsConsent.page'
import delay from './helpers/waits'

// This is our first test, more will be added soon

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.RECOVERY_PHRASE as string
    await WatchListPage.tapWalletSVG()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await RecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await RecoveryPhrasePage.tapSignInBtn()
    for (let i = 0; i < 12; i++) {
      await CreatePinPage.tapNumpadZero()
      await delay(500)
    }
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await expect(element(by.text('Collectibles'))).toBeVisible()
  })
})
