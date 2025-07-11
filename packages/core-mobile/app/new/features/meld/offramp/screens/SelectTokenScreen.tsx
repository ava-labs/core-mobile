import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SelectToken } from 'features/meld/components/SelectToken'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'

export const SelectTokenScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const {
    navigateToWithdrawAvax,
    navigateToWithdrawUsdc,
    isLoadingCryptoCurrencies
  } = useWithdraw()

  const selectOtherToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframpTokenList')
  }, [navigate])

  return (
    <SelectToken
      title={`What token do\nyou want to withdraw?`}
      isLoadingCryptoCurrencies={isLoadingCryptoCurrencies}
      onSelectOtherToken={selectOtherToken}
      onSelectAvax={navigateToWithdrawAvax}
      onSelectUsdc={navigateToWithdrawUsdc}
    />
  )
}
