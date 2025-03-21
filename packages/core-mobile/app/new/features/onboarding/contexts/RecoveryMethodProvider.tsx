import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import { copyToClipboard } from 'common/utils/clipboard'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { OidcAuth } from 'features/onboarding/types/types'
import { MFA } from 'seedless/types'

export interface RecoveryMethodContextState {
  handleCopyCode: () => void
  onVerifyCode: (code: string) => Promise<Result<undefined, TotpErrors>>
  totpKey?: string
  totpChallenge?: TotpChallenge
  setTotpChallenge: Dispatch<SetStateAction<TotpChallenge | undefined>>
  oidcAuth?: OidcAuth
  setOidcAuth: Dispatch<SetStateAction<OidcAuth | undefined>>
  mfaMethods?: MFA[]
  setMfaMethods: Dispatch<SetStateAction<MFA[] | undefined>>
}

export const RecoveryMethodContext = createContext<RecoveryMethodContextState>(
  {} as RecoveryMethodContextState
)

export const RecoveryMethodProvider = ({
  children
}: {
  children: ReactNode
}): React.JSX.Element => {
  const [oidcAuth, setOidcAuth] = useState<OidcAuth>()
  const [mfaMethods, setMfaMethods] = useState<MFA[]>()
  const [totpChallenge, setTotpChallenge] = useState<TotpChallenge>()

  const totpKey = useMemo(() => {
    if (totpChallenge?.url) {
      return new URL(totpChallenge.url).searchParams.get('secret') ?? undefined
    }
  }, [totpChallenge])

  const handleCopyCode = useCallback((): void => {
    totpKey && copyToClipboard(totpKey, 'Code copied')
  }, [totpKey])

  const onVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      await totpChallenge?.answer(code)

      if (oidcAuth) {
        return SeedlessService.session.verifyCode(
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

  const state: RecoveryMethodContextState = {
    handleCopyCode,
    onVerifyCode,
    totpKey,
    totpChallenge,
    setTotpChallenge,
    oidcAuth,
    setOidcAuth,
    mfaMethods,
    setMfaMethods
  }

  return (
    <RecoveryMethodContext.Provider value={state}>
      {children}
    </RecoveryMethodContext.Provider>
  )
}

export function useRecoveryMethodContext(): RecoveryMethodContextState {
  return useContext(RecoveryMethodContext)
}
