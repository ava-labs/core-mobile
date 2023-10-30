import React from 'react'
import { BottomSheet } from 'components/BottomSheet'
import EditFees from 'components/EditFees'
import { Network } from '@avalabs/chains-sdk'

type Props = {
  onClose?: () => void
  onSave: (newGasLimit: number) => void
  gasLimit: number
  gasPrice: bigint
  network: Network
}

const EditGasLimitBottomSheet: React.FC<Props> = ({
  onClose,
  onSave,
  gasLimit,
  gasPrice,
  network
}) => {
  return (
    <BottomSheet onClose={onClose}>
      <EditFees
        network={network}
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
