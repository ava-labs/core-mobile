import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import { showSnackbar } from 'common/utils/toast'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

function useSeedlessManageMFA(): {
  totpResetInit: (
    onInitialzied: (challenge: TotpChallenge) => void
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

  return {
    totpResetInit
  }
}

type HandleVerifyMfaSuccess<T> = (response: T) => Promise<void>

export default useSeedlessManageMFA
