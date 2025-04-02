import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { MFA } from 'seedless/types'
import { useState, useEffect, useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRouter } from 'expo-router'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const { seedlessExportService, sessionData, checkPendingExports } =
    useSeedlessMnemonicExportContext()
  const [mfaMethods, setMfaMethods] = useState<MFA[]>([])
  const { canGoBack, back } = useRouter()

  useEffect(() => {
    const getMfaMethods = async (): Promise<void> => {
      const mfas = await seedlessExportService.session.userMfa()
      setMfaMethods(mfas)
    }
    getMfaMethods()
  }, [seedlessExportService.session])

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate('./verifyTotpCode')
        return
      }

      if (recoveryMethod.mfa?.type === 'fido' && sessionData) {
        await seedlessExportService.session.approveFido(
          sessionData.oidcToken,
          sessionData.mfaId,
          true
        )
        canGoBack() && back()
        checkPendingExports()
      }
    },
    [
      sessionData,
      navigate,
      seedlessExportService.session,
      canGoBack,
      back,
      checkPendingExports
    ]
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
