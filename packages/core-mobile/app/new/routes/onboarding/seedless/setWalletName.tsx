import React, { useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { selectActiveAccount, setAccountTitle } from 'store/account'
import { WalletType } from 'services/wallet/types'
import { useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { useSelector } from 'react-redux'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)

  const handleNext = (): void => {
    AnalyticsService.capture('Onboard:WalletNameSet')
    dispatch(
      setAccountTitle({
        title: name,
        walletType: WalletType.SEEDLESS,
        accountId: activeAccount?.id ?? ''
      })
    )

    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/seedless/selectAvatar')
  }

  return <Component name={name} setName={setName} onNext={handleNext} />
}
