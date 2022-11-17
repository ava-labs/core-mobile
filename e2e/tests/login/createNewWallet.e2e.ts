/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { by, expect, element, device } from 'detox'
import Assert from '../../helpers/assertions'
import NewRecoveryPhrasePage from '../../pages/newRecoveryPhrase.page'
import AnalyticsConsentPage from '../../pages/analyticsConsent.page'
import WatchListPage from '../../pages/watchlist.page'
import VerifyPhrasePage from '../../pages/verifyPhrase.page'
import CreatePinPage from '../../pages/createPin.page'

describe('Create new wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should successfully add an existing wallet', async () => {
    await WatchListPage.tapNewWalletBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    const wordsObject: object =
      await NewRecoveryPhrasePage.mnemonicWordsObject()
    await NewRecoveryPhrasePage.tapIWroteItDownBtn()
    await NewRecoveryPhrasePage.tapIUnderstandBtn()
    const confirmWordsArray = await VerifyPhrasePage.selectWordNumbers(
      wordsObject
    )
    await VerifyPhrasePage.tapWordsToConfirm(confirmWordsArray)
    await VerifyPhrasePage.tapVerifyPhraseBtn()
    await CreatePinPage.createPin()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()

    await expect(element(by.text('Collectibles'))).toBeVisible()
  })
})
