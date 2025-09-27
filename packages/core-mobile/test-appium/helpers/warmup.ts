import onboardingPage from '../pages/onboarding.page'
import { actions } from './actions'

export default async function login() {
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
}

export async function unlockLoggedIn(pin = '000000') {
  await actions.tapNumberPad(pin)
}
