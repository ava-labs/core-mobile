import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { MFA } from 'seedless/types'
import { useState, useEffect, useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useLocalSearchParams, useRouter } from 'expo-router'
import SeedlessService from 'seedless/services/SeedlessService'
import { useInitSeedlessWalletAndUnlock } from 'common/hooks/useInitSeedlessWalletAndUnlock'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { initSeedlessWalletAndUnlock } = useInitSeedlessWalletAndUnlock()
  const { oidcToken, mfaId } = useLocalSearchParams<{
    oidcToken: string
    mfaId: string
  }>()
  const { navigate } = useRouter()
  const [mfaMethods, setMfaMethods] = useState<MFA[]>([])
  const { canGoBack, back } = useRouter()

  useEffect(() => {
    const getMfaMethods = async (): Promise<void> => {
      const mfas = await SeedlessService.session.userMfa()
      setMfaMethods(mfas)
    }
    getMfaMethods()
  }, [])

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate({
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
        await initSeedlessWalletAndUnlock()
        canGoBack() && back() // dismiss selectMfaMethod screen
        canGoBack() && back() // dismiss sessionExpired screen
      }
    },
    [oidcToken, mfaId, navigate, canGoBack, back, initSeedlessWalletAndUnlock]
  )

  return (
    <SelectRecoveryMethods
      mfaMethods={mfaMethods}
      onSelectMfa={type => handleSelectMfa(type)}
      sx={{ marginHorizontal: 16 }}
    />
  )
}

export default SelectMfaMethodScreen
