import { AddFidoChallenge, TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import { showSnackbar } from 'common/utils/toast'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

function useSeedlessManageMFA(): {
  totpResetInit: (
    onInitialized: (challenge: TotpChallenge) => void
  ) => Promise<void>
  fidoRegisterInit: (
    name: string,
    onInitialized: (challenge: AddFidoChallenge) => Promise<void>
  ) => Promise<void>
} {
  const { verifyMFA } = useVerifyMFA(SeedlessService.session)

  async function totpResetInit(
    onInitialized: (challenge: TotpChallenge) => void
  ): Promise<void> {
    try {
      const totpResetInitResponse =
        await SeedlessService.session.totpResetInit()

      if (totpResetInitResponse.requiresMfa()) {
        const handleVerifySuccess: HandleVerifyMfaSuccess<
          TotpChallenge
        > = async totpChallenge => {
          onInitialized(totpChallenge)
        }

        verifyMFA({
          response: totpResetInitResponse,
          onVerifySuccess: handleVerifySuccess
        })
      } else {
        const totpChallenge = totpResetInitResponse.data()

        onInitialized(totpChallenge)
      }
    } catch (e) {
      Logger.error('totpResetInit error', e)
      showSnackbar('Unable to reset totp. Please try again.')
    }
  }

  async function fidoRegisterInit(
    name: string,
    onInitialized: (challenge: AddFidoChallenge) => Promise<void>
  ): Promise<void> {
    try {
      const fidoRegisterInitResponse =
        await SeedlessService.session.fidoRegisterInit(name)

      if (fidoRegisterInitResponse.requiresMfa()) {
        const handleVerifySuccess: HandleVerifyMfaSuccess<
          AddFidoChallenge
        > = async addFidoChallenge => {
          onInitialized(addFidoChallenge)
        }

        verifyMFA({
          response: fidoRegisterInitResponse,
          onVerifySuccess: handleVerifySuccess
        })
      } else {
        const addFidoChallenge = fidoRegisterInitResponse.data()

        onInitialized(addFidoChallenge)
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
