import React, { useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useDispatch } from 'react-redux'
import { setAccountTitle } from 'store/account'
import { WalletType } from 'services/wallet/types'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function SetWalletName(): JSX.Element {
  const [name, setName] = useState<string>('Wallet 1')
  const dispatch = useDispatch()
  const { navigate } = useDebouncedRouter()

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
