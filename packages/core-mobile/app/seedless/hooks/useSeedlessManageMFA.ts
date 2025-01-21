import {
  AddFidoChallenge,
  Empty,
  TotpChallenge
} from '@cubist-labs/cubesigner-sdk'
import { showSimpleToast } from 'components/Snackbar'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'
import useVerifyMFA from './useVerifyMFA'

function useSeedlessManageMFA(): {
  totpResetInit: (
    onInitialized: (challenge: TotpChallenge) => void
  ) => Promise<void>
  fidoRegisterInit: (
    name: string,
    onInitialized: (challenge: AddFidoChallenge) => Promise<void>
  ) => Promise<void>
  fidoDelete: (fidoId: string, onDelete: () => void) => Promise<void>
} {
  const { verifyMFA } = useVerifyMFA(SeedlessService.sessionManager)

  async function totpResetInit(
    onInitialized: (challenge: TotpChallenge) => void
  ): Promise<void> {
    try {
      const totpResetInitResponse =
        await SeedlessService.sessionManager.totpResetInit()

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
      showSimpleToast('Unable to reset totp. Please try again.')
    }
  }

  async function fidoRegisterInit(
    name: string,
    onInitialized: (challenge: AddFidoChallenge) => Promise<void>
  ): Promise<void> {
    try {
      const fidoRegisterInitResponse =
        await SeedlessService.sessionManager.fidoRegisterInit(name)

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
      showSimpleToast('Unable to reset totp. Please try again.')
    }
  }

  async function fidoDelete(
    fidoId: string,
    onDelete: () => void
  ): Promise<void> {
    const fidoDeleteResponse = await SeedlessService.sessionManager.deleteFido(
      fidoId
    )

    if (fidoDeleteResponse.requiresMfa()) {
      const handleVerifySuccess: HandleVerifyMfaSuccess<Empty> = async () => {
        onDelete()
      }

      verifyMFA({
        response: fidoDeleteResponse,
        onVerifySuccess: handleVerifySuccess,
        excludeFidoMfaId: fidoId
      })
    } else {
      throw new Error('fidoDelete requires MFA')
    }
  }

  return {
    totpResetInit,
    fidoRegisterInit,
    fidoDelete
  }
}

type HandleVerifyMfaSuccess<T> = (response: T) => Promise<void>

export default useSeedlessManageMFA
