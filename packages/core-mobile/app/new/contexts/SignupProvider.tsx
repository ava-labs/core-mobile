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
import { useRouter } from 'expo-router'
import { copyToClipboard } from 'new/utils/clipboard'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { hideLogoModal, showLogoModal } from 'new/components/LogoModal'
import { OidcAuth } from 'new/types'

export interface SignupContextState {
  handleAccountVerified: () => Promise<void>
  handleCopyCode: () => void
  onVerifyCode: (code: string) => Promise<Result<undefined, TotpErrors>>
  totpKey?: string
  totpChallenge?: TotpChallenge
  setTotpChallenge: Dispatch<SetStateAction<TotpChallenge | undefined>>
  oidcAuth?: OidcAuth
  setOidcAuth: Dispatch<SetStateAction<OidcAuth | undefined>>
}

export const SignupContext = createContext<SignupContextState>(
  {} as SignupContextState
)

export const SignupProvider = ({
  children
}: {
  children: ReactNode
}): React.JSX.Element => {
  const router = useRouter()
  const [oidcAuth, setOidcAuth] = useState<OidcAuth>()
  const [totpChallenge, setTotpChallenge] = useState<TotpChallenge>()

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

  const handleAccountVerified = useCallback(async (): Promise<void> => {
    showLogoModal()
    const walletName = await SeedlessService.getAccountName()
    hideLogoModal()

    if (walletName) {
      router.navigate('./createPin')
      return
    }
    router.navigate('./nameYourWallet')
  }, [router])

  const state: SignupContextState = {
    handleAccountVerified,
    handleCopyCode,
    onVerifyCode,
    totpKey,
    totpChallenge,
    setTotpChallenge,
    oidcAuth,
    setOidcAuth
  }

  return (
    <SignupContext.Provider value={state}>{children}</SignupContext.Provider>
  )
}

export function useSignupContext(): SignupContextState {
  return useContext(SignupContext)
}
