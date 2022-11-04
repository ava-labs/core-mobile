/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { by, expect, element, device } from 'detox'
import Assert from '../../helpers/assertions'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import CreatePinPage from '../../pages/createPin.page'
import AnalyticsConsentPage from '../../pages/analyticsConsent.page'
import delay from '../../helpers/waits'
import WatchListPage from '../../pages/watchlist.page'

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.RECOVERY_PHRASE as string
    await WatchListPage.tapWalletSVG()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    for (let i = 0; i < 12; i++) {
      await CreatePinPage.tapNumpadZero()
      await delay(500)
    }
    await CreatePinPage.tapEmptyCheckbox()
    // await CreatePinPage.tapNextBtn()
    await expect(element(by.text('Collectibles'))).toBeVisible()
  })
})
