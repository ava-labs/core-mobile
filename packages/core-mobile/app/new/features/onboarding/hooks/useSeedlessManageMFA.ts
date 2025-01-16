import { AddFidoChallenge, TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import { showSnackbar } from 'common/utils/toast'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

function useSeedlessManageMFA(): {
  totpResetInit: (
    onInitialzied: (challenge: TotpChallenge) => void
  ) => Promise<void>
  fidoRegisterInit: (
    name: string,
    onInitialzied: (challenge: AddFidoChallenge) => Promise<void>
  ) => Promise<void>
} {
  const { verifyMFA } = useVerifyMFA(SeedlessService.sessionManager)

  async function totpResetInit(
    onInitialzied: (challenge: TotpChallenge) => void
  ): Promise<void> {
    try {
      const totpResetInitResponse =
        await SeedlessService.sessionManager.totpResetInit()

      if (totpResetInitResponse.requiresMfa()) {
        const handleVerifySuccess: HandleVerifyMfaSuccess<
          TotpChallenge
        > = async totpChallenge => {
          onInitialzied(totpChallenge)
        }

        verifyMFA({
          response: totpResetInitResponse,
          onVerifySuccess: handleVerifySuccess
        })
      } else {
        const totpChallenge = totpResetInitResponse.data()

        onInitialzied(totpChallenge)
      }
    } catch (e) {
      Logger.error('totpResetInit error', e)
      showSnackbar('Unable to reset totp. Please try again.')
    }
  }

  async function fidoRegisterInit(
    name: string,
    onInitialzied: (challenge: AddFidoChallenge) => Promise<void>
  ): Promise<void> {
    try {
      const fidoRegisterInitResponse =
        await SeedlessService.sessionManager.fidoRegisterInit(name)

      if (fidoRegisterInitResponse.requiresMfa()) {
        const handleVerifySuccess: HandleVerifyMfaSuccess<
          AddFidoChallenge
        > = async addFidoChallenge => {
          onInitialzied(addFidoChallenge)
        }

        verifyMFA({
          response: fidoRegisterInitResponse,
          onVerifySuccess: handleVerifySuccess
        })
      } else {
        const addFidoChallenge = fidoRegisterInitResponse.data()

        onInitialzied(addFidoChallenge)
      }
    } catch (e) {
      Logger.error('fidoRegisterInit error', e)
      showSnackbar('Unable to reset totp. Please try again.')
    }
  }

  return {
    totpResetInit,
    fidoRegisterInit
  }
}

type HandleVerifyMfaSuccess<T> = (response: T) => Promise<void>

export default useSeedlessManageMFA
