import React, { useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { setAccountTitle } from 'store/account'
import { WalletType } from 'services/wallet/types'
import { useRouter } from 'expo-router'
import { SetWalletName as Component } from 'new/components/onboarding/SetWalletName'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('')
  const dispatch = useDispatch()
  const { navigate } = useRouter()

  const handleNext = (): void => {
    AnalyticsService.capture('Onboard:WalletNameSet')
    dispatch(
      setAccountTitle({
        title: name,
        walletType: WalletType.SEEDLESS,
        accountIndex: 0
      })
    )
    navigate('./selectAvatar')
  }

  return <Component name={name} setName={setName} onNext={handleNext} />
}
