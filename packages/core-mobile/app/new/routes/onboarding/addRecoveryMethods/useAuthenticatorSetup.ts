import { useRouter } from 'expo-router'
import { showSnackbar } from 'new/utils/toast'
import useSeedlessManageMFA from 'seedless/hooks/useSeedlessManageMFA'
// import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import PasskeyService from 'services/passkey/PasskeyService'
import { FidoType } from 'services/passkey/types'
import Logger from 'utils/Logger'

type AuthenticatorSetup = {
  registerAndAuthenticateFido: ({
    name,
    fidoType
  }: RegisterAndAuthenticateFido) => Promise<void>
  registerAndAuthenticateTotp: () => void
}

type RegisterAndAuthenticateFido = {
  name?: string
  fidoType: FidoType
}

export const useAuthenticatorSetup = (): AuthenticatorSetup => {
  const router = useRouter()
  const { fidoRegisterInit } = useSeedlessManageMFA()

  const registerAndAuthenticateFido = async ({
    name,
    fidoType
  }: RegisterAndAuthenticateFido): Promise<void> => {
    // console.log('registerAndAuthenticateFido')
    const passkeyName = name && name.length > 0 ? name : fidoType.toString()
    // showLogoModal()

    try {
      const withSecurityKey = fidoType === FidoType.YUBI_KEY

      fidoRegisterInit(passkeyName, async challenge => {
        const credential = await PasskeyService.register(
          challenge.options,
          withSecurityKey
        )

        await challenge.answer(credential)

        AnalyticsService.capture('SeedlessMfaAdded')

        // if (oidcAuth) {
        //   await SeedlessService.sessionManager.approveFido(
        //     oidcAuth.oidcToken,
        //     oidcAuth.mfaId,
        //     withSecurityKey
        //   )

        //   AnalyticsService.capture('SeedlessMfaVerified', { type: fidoType })
        // }

        if (router.canGoBack()) {
          router.back
        }

        // onAccountVerified(true)
      })
    } catch (e) {
      Logger.error(`${fidoType} registration failed`, e)
      showSnackbar(`Unable to register ${fidoType}`)
    } finally {
      //   hideLogo()
    }
  }

  const registerAndAuthenticateTotp = (): void => {
    // navigate(AppNavigation.RecoveryMethods.TotpSetup, {
    //     oidcAuth,
    //     onAccountVerified
    //   })

    AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
  }

  return {
    registerAndAuthenticateFido,
    registerAndAuthenticateTotp
  }
}
