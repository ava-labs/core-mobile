import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { InteractionManager } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import TabViewBackground from 'screens/portfolio/components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TokenSelector from 'screens/send/TokenSelector'
import AvaText from 'components/AvaText'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type RouteProp = WalletScreenProps<
  typeof AppNavigation.Modal.SelectToken
>['route']

function SelectTokenBottomSheet(): JSX.Element {
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

  function onTokenSelected(token: TokenWithBalance) {
    handleClose()
    params.onTokenSelected(token)
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
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Select Token
      </AvaText.LargeTitleBold>
      <TokenSelector onTokenSelected={onTokenSelected} />
    </BottomSheet>
  )
}

export default SelectTokenBottomSheet
