/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { device } from 'detox'
import Assert from '../../helpers/assertions'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import WatchListPage from '../../pages/watchlist.page'

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
  })
})
