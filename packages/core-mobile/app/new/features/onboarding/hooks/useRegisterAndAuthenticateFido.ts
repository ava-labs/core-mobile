import { FidoType } from 'services/passkey/types'
import PasskeyService from 'services/passkey/PasskeyService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'
import { showSnackbar } from 'common/utils/toast'
import { useLogoModal } from 'common/hooks/useLogoModal'
import { useRecoveryMethodContext } from '../contexts/RecoveryMethodProvider'
import useSeedlessManageMFA from './useSeedlessManageMFA'

export const useRegisterAndAuthenticateFido = (): {
  registerAndAuthenticateFido: ({
    name,
    fidoType,
    onAccountVerified,
    verifyMfaPath
  }: {
    name?: string
    fidoType: FidoType
    onAccountVerified: () => void
    verifyMfaPath: string
  }) => Promise<void>
} => {
  const { showLogoModal, hideLogoModal } = useLogoModal()
  const { oidcAuth } = useRecoveryMethodContext()
  const { fidoRegisterInit } = useSeedlessManageMFA()

  const registerAndAuthenticateFido = async ({
    name,
    fidoType,
    onAccountVerified,
    verifyMfaPath
  }: {
    name?: string
    fidoType: FidoType
    onAccountVerified: () => void
    verifyMfaPath: string
  }): Promise<void> => {
    const passkeyName = name && name.length > 0 ? name : fidoType.toString()

    showLogoModal()

    try {
      const withSecurityKey = fidoType === FidoType.YUBI_KEY

      fidoRegisterInit(
        passkeyName,
        async challenge => {
          const credential = await PasskeyService.createCredential(
            challenge.options,
            withSecurityKey
          )

          await challenge.answer(credential)

          AnalyticsService.capture('SeedlessMfaAdded')

          if (oidcAuth) {
            await SeedlessService.session.approveFido(
              oidcAuth.oidcToken,
              oidcAuth.mfaId,
              withSecurityKey
            )

            AnalyticsService.capture('SeedlessMfaVerified', { type: fidoType })
          }
          onAccountVerified()
        },
        verifyMfaPath
      )
    } catch (e) {
      Logger.error(`${fidoType} registration failed`, e)
      showSnackbar(`Unable to register ${fidoType}`)
    } finally {
      hideLogoModal()
    }
  }
  return { registerAndAuthenticateFido }
}
