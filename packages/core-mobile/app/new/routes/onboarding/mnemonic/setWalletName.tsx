import React, { useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch, useSelector } from 'react-redux'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { selectActiveWallet, setWalletName } from 'store/wallet/slice'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const activeWallet = useSelector(selectActiveWallet)

  const handleNext = (): void => {
    if (!activeWallet) {
      return
    }
    AnalyticsService.capture('Onboard:WalletNameSet')
    dispatch(setWalletName({ walletId: activeWallet.id, name }))
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/selectAvatar',
      params: { mnemonic }
    })
  }

  return <Component name={name} setName={setName} onNext={handleNext} />
}
