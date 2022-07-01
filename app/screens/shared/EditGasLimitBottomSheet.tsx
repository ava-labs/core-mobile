import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { InteractionManager } from 'react-native'
import TabViewBackground from 'components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import EditFees from 'components/EditFees'

type Props = {
  onClose: () => void
  onSave: (newGasLimit: number) => void
  gasLimit: string
  networkFee: string
}

const EditGasLimitBottomSheet: React.FC<Props> = ({
  onClose,
  onSave,
  gasLimit,
  networkFee
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
      onClose()
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
        networkFee={networkFee}
      />
    </BottomSheet>
  )
}

export default EditGasLimitBottomSheet
