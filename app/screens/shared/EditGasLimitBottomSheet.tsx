import React from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import TabViewBackground from 'components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import EditFees from 'components/EditFees'
import { BigNumber } from 'ethers'

type Props = {
  onClose?: () => void
  onSave: (newGasLimit: number) => void
  gasLimit: number
  gasPrice: BigNumber
}

const snapPoints = ['90%']

const EditGasLimitBottomSheet: React.FC<Props> = ({
  onClose,
  onSave,
  gasLimit,
  gasPrice
}) => {
  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      enablePanDownToClose
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onClose={onClose}>
      <EditFees
        onSave={newGasLimit => {
          onSave(newGasLimit)
          onClose?.()
        }}
        gasLimit={gasLimit}
        gasPrice={gasPrice}
      />
    </BottomSheet>
  )
}

export default EditGasLimitBottomSheet
