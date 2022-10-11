import React from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useNavigation, useRoute } from '@react-navigation/native'
import TabViewBackground from 'components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TokenSelector from 'screens/send/TokenSelector'
import AvaText from 'components/AvaText'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { TokenWithBalance } from 'store/balance'

type RouteProp = WalletScreenProps<
  typeof AppNavigation.Modal.SelectToken
>['route']

const snapPoints = ['90%']

function SelectTokenBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()
  const { params } = useRoute<RouteProp>()

  function onTokenSelected(token: TokenWithBalance) {
    goBack()
    params.onTokenSelected(token)
  }

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundComponent={TabViewBackground}
      onClose={goBack}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Select Token
      </AvaText.LargeTitleBold>
      <TokenSelector
        onTokenSelected={onTokenSelected}
        hideZeroBalance={params.hideZeroBalance}
      />
    </BottomSheet>
  )
}

export default SelectTokenBottomSheet
