import { useUserMfa } from 'common/hooks/useUserMfa'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import React, { useCallback } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import { useWallet } from 'hooks/useWallet'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { unlock } = useWallet()
  const { oidcToken, mfaId } = useLocalSearchParams<{
    oidcToken: string
    mfaId: string
  }>()
  const { navigate } = useRouter()
  const { canGoBack, back } = useRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/sessionExpired/verifyTotpCode',
          params: {
            mfaId,
            oidcToken
          }
        })
        return
      }

      if (recoveryMethod.mfa?.type === 'fido' && oidcToken && mfaId) {
        await SeedlessService.session.approveFido(oidcToken, mfaId, true)
        await unlock()
        canGoBack() && back() // dismiss selectMfaMethod screen
        canGoBack() && back() // dismiss sessionExpired screen
      }
    },
    [oidcToken, mfaId, navigate, unlock, canGoBack, back]
  )

  return (
    <SelectRecoveryMethods
      mfaMethods={mfaMethods ?? []}
      onSelectMfa={type => handleSelectMfa(type)}
      isLoading={isLoading}
    />
  )
}

export default SelectMfaMethodScreen
