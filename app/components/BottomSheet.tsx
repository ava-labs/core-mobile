import React, { useCallback, useEffect, useRef } from 'react'
import * as RNBottomSheet from '@gorhom/bottom-sheet'
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { InteractionManager } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TabViewBackground from 'components/TabViewBackground'

interface Props {
  snapPoints: [string, string]
  children: React.ReactNode
  snapTo: number
  disablePanningGesture?: boolean
}

function AvaBottomSheet({
  snapPoints,
  children,
  snapTo,
  disablePanningGesture
}: Props): JSX.Element {
  const { goBack } = useNavigation()
  const bottomSheetModalRef = useRef<RNBottomSheet.default>(null)

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(snapTo)
    }, 100)
  }, [snapTo])

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close()
    InteractionManager.runAfterInteractions(() => goBack())
  }, [])

  const handleChange = useCallback(index => {
    index === 0 && handleClose()
  }, [])

  return (
    <RNBottomSheet.default
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enableContentPanningGesture={!disablePanningGesture}
      backgroundComponent={TabViewBackground}
      onChange={handleChange}>
      {children}
    </RNBottomSheet.default>
  )
}

export default AvaBottomSheet
