import React from 'react'
import { BottomSheet } from 'components/BottomSheet'
import EditFees from 'components/EditFees'

type Props = {
  onClose?: () => void
  onSave: (newGasLimit: number) => void
  gasLimit: number
  gasPrice: bigint
}

const EditGasLimitBottomSheet: React.FC<Props> = ({
  onClose,
  onSave,
  gasLimit,
  gasPrice
}) => {
  return (
    <BottomSheet onClose={onClose}>
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
