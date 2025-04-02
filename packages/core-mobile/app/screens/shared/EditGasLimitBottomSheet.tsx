import React from 'react'
import EditFees from 'components/EditFees'
import { Network } from '@avalabs/core-chains-sdk'
import { Sheet } from 'components/Sheet'
import { noop } from '@avalabs/core-utils-sdk'
import { Eip1559Fees } from 'utils/Utils'

type Props = {
  onClose?: () => void
  onSave: (customFees: Eip1559Fees) => void
  network: Network
  lowMaxFeePerGas: bigint
  isGasLimitEditable?: boolean
  feeDecimals?: number
  noGasLimitError?: string
} & Eip1559Fees

const EditGasLimitBottomSheet = ({
  onClose,
  onSave,
  gasLimit,
  maxPriorityFeePerGas,
  maxFeePerGas,
  network,
  lowMaxFeePerGas,
  isGasLimitEditable,
  feeDecimals,
  noGasLimitError
}: Props): JSX.Element => {
  return (
    <Sheet onClose={onClose || noop}>
      <EditFees
        network={network}
        onSave={newGasLimit => {
          onSave(newGasLimit)
          onClose?.()
        }}
        gasLimit={gasLimit}
        maxFeePerGas={maxFeePerGas}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
        lowMaxFeePerGas={lowMaxFeePerGas}
        isGasLimitEditable={isGasLimitEditable}
        feeDecimals={feeDecimals}
        noGasLimitError={noGasLimitError}
      />
    </Sheet>
  )
}

export default EditGasLimitBottomSheet
