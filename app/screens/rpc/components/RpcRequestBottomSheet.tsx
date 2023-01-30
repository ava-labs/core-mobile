import React from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TabViewBackground from 'components/TabViewBackground'

const snapPoints = ['90%']

type Props = {
  children: React.ReactNode
  onClose: () => void
}

const RpcRequestBottomSheet: React.FC<Props> = ({ children, onClose }) => {
  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundComponent={TabViewBackground}
      enableContentPanningGesture={false}
      onClose={onClose}>
      {children}
    </BottomSheet>
  )
}

export default RpcRequestBottomSheet
