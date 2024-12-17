import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import useSeedlessManageMFA from 'seedless/hooks/useSeedlessManageMFA'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { useRouter } from 'expo-router'
import { copyToClipboard } from 'new/utils/clipboard'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessOidcContext } from './SeedlessOidcProvider'

export interface TotpContextState {
  handleCopyCode: () => void
  onVerifyCode: (code: string) => Promise<Result<undefined, TotpErrors>>
  onVerifySuccess: () => void
  goToEnterCodeManually: () => void
  goToScanQrCode: () => void
  goToVerifyCode: () => void
  totpKey?: string
  totpChallenge?: TotpChallenge
  setTotpChallenge: Dispatch<SetStateAction<TotpChallenge | undefined>>
}

export const TotpContext = createContext<TotpContextState>(
  {} as TotpContextState
)

export const TotpProvider = ({
  children
}: {
  children: ReactNode
}): React.JSX.Element => {
  const router = useRouter()
  const { oidcAuth, onAccountVerified } = useSeedlessOidcContext()
  const [totpChallenge, setTotpChallenge] = useState<TotpChallenge>()
  const { totpResetInit } = useSeedlessManageMFA()

  useEffect(() => {
    const initChallenge = async (): Promise<void> => {
      try {
        totpResetInit(challenge => {
          setTotpChallenge(challenge)
        })
      } catch (e) {
        Logger.error('registerTotp error', e)
        AnalyticsService.capture('SeedlessRegisterTOTPStartFailed')
      }
    }

    if (totpChallenge === undefined) {
      initChallenge()
    }
  }, [totpResetInit, totpChallenge])

  const totpKey = useMemo(() => {
    if (totpChallenge?.totpUrl) {
      return (
        new URL(totpChallenge.totpUrl).searchParams.get('secret') ?? undefined
      )
    }
  }, [totpChallenge])

  const handleCopyCode = useCallback((): void => {
    totpKey && copyToClipboard(totpKey, 'Code copied')
  }, [totpKey])

  const goToEnterCodeManually = (): void => {
    router.navigate('./copyCode')
  }

  const goToScanQrCode = (): void => {
    router.navigate('./scanQrCode')
  }

  const goToVerifyCode = (): void => {
    router.navigate('./authenticatorSetup/verifyCode')
  }

  const onVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      await totpChallenge?.answer(code)

      if (oidcAuth) {
        return SeedlessService.sessionManager.verifyCode(
          oidcAuth.oidcToken,
          oidcAuth.mfaId,
          code
        )
      } else {
        return { success: true, value: undefined }
      }
    },
    [oidcAuth, totpChallenge]
  )

  const onVerifySuccess = useCallback((): void => {
    router.back()
    onAccountVerified(true)
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: 'Authenticator'
    })
  }, [router, onAccountVerified])

  const state: TotpContextState = {
    handleCopyCode,
    onVerifyCode,
    onVerifySuccess,
    goToEnterCodeManually,
    goToScanQrCode,
    goToVerifyCode,
    totpKey,
    totpChallenge,
    setTotpChallenge
  }

  return <TotpContext.Provider value={state}>{children}</TotpContext.Provider>
}

export function useTotpContext(): TotpContextState {
  return useContext(TotpContext)
}
