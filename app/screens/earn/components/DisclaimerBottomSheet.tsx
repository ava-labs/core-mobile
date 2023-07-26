import React, { FC } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import TabViewBackground from 'components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import { Disclaimer } from './Disclaimer'

type Props = {
  onClose?: () => void
}

const snapPoints = ['90%']

export const DisclaimerBottomSheet: FC<Props> = ({ onClose }) => {
  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      enablePanDownToClose
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onClose={onClose}>
      <Disclaimer />
    </BottomSheet>
  )
}
