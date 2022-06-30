import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { InteractionManager } from 'react-native'
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

function BridgeSelectTokenBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()
  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['0%', '90%'], [])
  const { params } = useRoute<RouteProp>()

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1)
    }, 100)
  }, [])

  function onTokenSelected(symbol: string) {
    handleClose()
    params.onTokenSelected(symbol)
  }

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close()
    InteractionManager.runAfterInteractions(() => goBack())
  }, [])

  const handleChange = useCallback(index => {
    index === 0 && handleClose()
  }, [])

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onChange={handleChange}>
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
