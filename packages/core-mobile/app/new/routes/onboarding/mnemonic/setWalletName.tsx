import React, { useCallback, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { setWalletName } from 'store/wallet/slice'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { isLimitedMode } from 'utils/limitedMode'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const activeWallet = useActiveWallet()
  const { recovering } = useGlobalSearchParams<{ recovering: string }>()

  const handleNext = useCallback((): void => {
    AnalyticsService.capture('Onboard:WalletNameSet')
    dispatch(setWalletName({ walletId: activeWallet.id, name }))
    navigate({
      // Limited mode skips the avatar selection step.
      pathname: isLimitedMode
        ? '/onboarding/mnemonic/confirmation'
        : '/onboarding/mnemonic/selectAvatar'
    })
  }, [activeWallet.id, dispatch, name, navigate])

  // Limited mode wizard: setWalletName is step 4/6 in the create flow,
  // step 3/5 in recovery.
  const wizardStep = isLimitedMode
    ? recovering === 'true'
      ? { currentStep: 3, totalSteps: 5 }
      : { currentStep: 4, totalSteps: 6 }
    : undefined

  return (
    <Component
      name={name}
      setName={setName}
      onNext={handleNext}
      wizardStep={wizardStep}
    />
  )
}
