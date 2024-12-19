import { hideLogoModal, showLogoModal } from 'new/components/LogoModal'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { FidoType } from 'services/passkey/types'
import PasskeyService from 'services/passkey/PasskeyService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import { showSnackbar } from 'new/utils/toast'
import Logger from 'utils/Logger'
import useSeedlessManageMFA from './useSeedlessManageMFA'

export const useRegisterAndAuthenticateFido = (): {
  registerAndAuthenticateFido: ({
    name,
    fidoType
  }: {
    name?: string
    fidoType: FidoType
  }) => Promise<void>
} => {
  const { oidcAuth, handleAccountVerified } = useSignupContext()
  const { fidoRegisterInit } = useSeedlessManageMFA()

  const registerAndAuthenticateFido = async ({
    name,
    fidoType
  }: {
    name?: string
    fidoType: FidoType
  }): Promise<void> => {
    const passkeyName = name && name.length > 0 ? name : fidoType.toString()

    showLogoModal()

    try {
      const withSecurityKey = fidoType === FidoType.YUBI_KEY

      fidoRegisterInit(passkeyName, async challenge => {
        const credential = await PasskeyService.create(
          challenge.options,
          withSecurityKey
        )

        await challenge.answer(credential)

        AnalyticsService.capture('SeedlessMfaAdded')

        if (oidcAuth) {
          await SeedlessService.sessionManager.approveFido(
            oidcAuth.oidcToken,
            oidcAuth.mfaId,
            withSecurityKey
          )

          AnalyticsService.capture('SeedlessMfaVerified', { type: fidoType })
        }
        handleAccountVerified()
      })
    } catch (e) {
      Logger.error(`${fidoType} registration failed`, e)
      showSnackbar(`Unable to register ${fidoType}`)
    } finally {
      hideLogoModal()
    }
  }
  return { registerAndAuthenticateFido }
}
