import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { InteractionManager } from 'react-native'
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

const EditGasLimitBottomSheet: React.FC<Props> = ({
  onClose,
  onSave,
  gasLimit,
  gasPrice
}) => {
  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['0%', '90%'], [])

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1)
    }, 100)
  }, [])

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close()

    InteractionManager.runAfterInteractions(() => {
      onClose?.()
    })
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
      <EditFees
        onSave={newGasLimit => {
          onSave(newGasLimit)
          handleClose()
        }}
        gasLimit={gasLimit}
        gasPrice={gasPrice}
      />
    </BottomSheet>
  )
}

export default EditGasLimitBottomSheet
