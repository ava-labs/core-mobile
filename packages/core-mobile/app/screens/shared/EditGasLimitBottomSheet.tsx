import React from 'react'
import EditFees from 'components/EditFees'
import { Network } from '@avalabs/chains-sdk'
import { TokenBaseUnit } from 'types/TokenBaseUnit'
import { Sheet } from 'components/Sheet'
import { noop } from '@avalabs/utils-sdk'
import { Eip1559Fees } from 'utils/Utils'
import { NetworkTokenUnit } from 'types'

type Props<T extends TokenBaseUnit<T>> = {
  onClose?: () => void
  onSave: (customFees: Eip1559Fees<T>) => void
  network: Network
  lowMaxFeePerGas: NetworkTokenUnit
  isGasLimitEditable?: boolean
} & Eip1559Fees<T>

const EditGasLimitBottomSheet = ({
  onClose,
  onSave,
  gasLimit,
  maxPriorityFeePerGas,
  maxFeePerGas,
  network,
  lowMaxFeePerGas,
  isGasLimitEditable
}: Props<NetworkTokenUnit>): JSX.Element => {
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
      />
    </Sheet>
  )
}

export default EditGasLimitBottomSheet
