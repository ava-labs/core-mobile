import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { SwapScreenProps } from 'navigation/types'
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet'

type ScreenProps = SwapScreenProps<typeof AppNavigation.Swap.SwapTransactionFee>

const SwapTransactionFee = () => {
  const { goBack } = useNavigation<ScreenProps['navigation']>()
  const { params } = useRoute<ScreenProps['route']>()

  const onSave = (newGasLimit: number) => params.onSave(newGasLimit)

  return (
    <EditGasLimitBottomSheet
      onClose={goBack}
      onSave={onSave}
      networkFee={params.networkFee}
      gasLimit={params.gasLimit}
    />
  )
}

export default SwapTransactionFee
