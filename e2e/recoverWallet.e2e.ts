/* eslint-env detox/detox, jest */
import { by, expect, element } from 'detox'
import WatchListPage from './pages/watchlist.page'
import Assert from './helpers/assertions'
import RecoveryPhrasePage from './pages/recoveryPhrase.page'
import CreatePinPage from './pages/createPin.page'

// This is our first test, more will be added soon

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.existingWalletBtn)
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.RECOVERY_PHRASE as string
    await WatchListPage.tapExistingWalletBtn()
    await RecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await RecoveryPhrasePage.tapSignInBtn()
    for (let i = 0; i < 12; i++) {
      await CreatePinPage.tapNumpadZero()
    }
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await expect(await element(by.text('Collectibles'))).toBeVisible()
  })
})
