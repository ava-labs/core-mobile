import onboardingPage from '../pages/onboarding.page'
import settingsPage from '../pages/settings.page'
import { actions } from './actions'

export default async function warmup(addAccount = false) {
  await onboardingPage.exitMetro()
  await onboardingPage.tapAccessExistingWallet()
  await onboardingPage.tapTypeInRecoveryPhase()
  await onboardingPage.tapAgreeAndContinue()
  await onboardingPage.tapUnlockBtn()
  await onboardingPage.enterRecoveryPhrase(process.env.E2E_MNEMONIC as string)
  await onboardingPage.tapImport()
  await onboardingPage.enterPin()
  await onboardingPage.enterWalletName()
  await onboardingPage.tapNextBtnOnNameWallet()
  await onboardingPage.tapNextBtnOnAvatarScreen()
  await onboardingPage.tapLetsGo()
  await onboardingPage.dismissModals()
  if (addAccount) {
    await settingsPage.createNthAccount()
  }
}

export async function unlockLoggedIn(pin = '000000') {
  await actions.tapNumberPad(pin)
}
