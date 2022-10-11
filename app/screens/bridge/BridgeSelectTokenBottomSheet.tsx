import React from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useNavigation, useRoute } from '@react-navigation/native'
import TabViewBackground from 'components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import AvaText from 'components/AvaText'
import BridgeTokenSelector, {
  SelectTokenMode
} from 'screens/bridge/BridgeTokenSelector'
import AppNavigation from 'navigation/AppNavigation'
import { BridgeScreenProps } from 'navigation/types'

type RouteProp = BridgeScreenProps<
  typeof AppNavigation.Modal.BridgeSelectToken
>['route']

const snapPoints = ['90%']

function BridgeSelectTokenBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()
  const { params } = useRoute<RouteProp>()

  function onTokenSelected(symbol: string) {
    goBack()
    params.onTokenSelected(symbol)
  }

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      enablePanDownToClose
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onClose={goBack}>
      <>
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
          Select Token
        </AvaText.LargeTitleBold>
        <BridgeTokenSelector
          onTokenSelected={onTokenSelected}
          bridgeTokenList={params.bridgeTokenList ?? []}
          selectMode={SelectTokenMode.TRANSFER}
          horizontalMargin={0}
        />
      </>
    </BottomSheet>
  )
}

export default BridgeSelectTokenBottomSheet
