import React, { useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { setWalletName } from 'store/account'
import { useLocalSearchParams } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const dispatch = useDispatch()
  const { navigate } = useDebouncedRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()

  const handleNext = (): void => {
    AnalyticsService.capture('Onboard:WalletNameSet')
    dispatch(setWalletName(name))
    navigate({ pathname: './selectAvatar', params: { mnemonic } })
  }

  return <Component name={name} setName={setName} onNext={handleNext} />
}
