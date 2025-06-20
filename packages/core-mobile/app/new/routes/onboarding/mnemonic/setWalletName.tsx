import React, { useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { setWalletName } from 'store/wallet/slice'
import { useActiveWallet } from 'common/hooks/useActiveWallet'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const activeWallet = useActiveWallet()

  const handleNext = (): void => {
    AnalyticsService.capture('Onboard:WalletNameSet')
    dispatch(setWalletName({ walletId: activeWallet.id, name }))
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/selectAvatar'
    })
  }

  return <Component name={name} setName={setName} onNext={handleNext} />
}
