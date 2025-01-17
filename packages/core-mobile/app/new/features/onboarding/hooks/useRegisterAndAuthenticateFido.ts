import { FidoType } from 'services/passkey/types'
import PasskeyService from 'services/passkey/PasskeyService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'
import { showSnackbar } from 'common/utils/toast'
import { showLogoModal, hideLogoModal } from 'common/components/LogoModal'
import { useRecoveryMethodContext } from '../contexts/RecoveryMethodProvider'
import useSeedlessManageMFA from './useSeedlessManageMFA'
import { showSimpleToast } from 'components/Snackbar'

export const useRegisterAndAuthenticateFido = (): {
  registerAndAuthenticateFido: ({
    name,
    fidoType,
    onAccountVerified
  }: {
    name?: string
    fidoType: FidoType
    onAccountVerified: () => void
  }) => Promise<void>
} => {
  const { oidcAuth } = useRecoveryMethodContext()
  const { fidoRegisterInit } = useSeedlessManageMFA()

  const registerAndAuthenticateFido = async ({
    name,
    fidoType,
    onAccountVerified
  }: {
    name?: string
    fidoType: FidoType
    onAccountVerified: () => void
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

        try {
          await challenge.answer(credential)
        } catch (error) {
          showSimpleToast('3 ' + JSON.stringify(error))
          return
        }

        AnalyticsService.capture('SeedlessMfaAdded')

        if (oidcAuth) {
          await SeedlessService.sessionManager.approveFido(
            oidcAuth.oidcToken,
            oidcAuth.mfaId,
            withSecurityKey
          )

          AnalyticsService.capture('SeedlessMfaVerified', { type: fidoType })
        }
        onAccountVerified()
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
