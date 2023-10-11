/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import WatchListPage from '../../pages/watchlist.page'
import PortfolioPage from '../../pages/portfolio.page'
import BottomTabsPage from '../../pages/bottomTabs.page'

describe('Unlock app with recovery phrase', () => {
  beforeAll(async () => {
    await warmup()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
  })

  it('should successfully unlock app with recovery phrase', async () => {
    await WatchListPage.tapEnterWalletBtn()
    await CreatePinPage.tapSignInWithRecoveryPhraseBtn()
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  })
})
