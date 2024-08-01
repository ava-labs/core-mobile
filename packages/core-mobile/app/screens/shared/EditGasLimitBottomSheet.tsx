import React from 'react'
import EditFees from 'components/EditFees'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenBaseUnit } from 'types/TokenBaseUnit'
import { Sheet } from 'components/Sheet'
import { noop } from '@avalabs/core-utils-sdk'
import { Eip1559Fees } from 'utils/Utils'
import { NetworkTokenUnit } from 'types'

type Props<T extends TokenBaseUnit<T>> = {
  onClose?: () => void
  onSave: (customFees: Eip1559Fees<T>) => void
  network: Network
  lowMaxFeePerGas: NetworkTokenUnit
  isGasLimitEditable?: boolean
  isBtcNetwork?: boolean
  noGasLimitError?: string
} & Eip1559Fees<T>

const EditGasLimitBottomSheet = ({
  onClose,
  onSave,
  gasLimit,
  maxPriorityFeePerGas,
  maxFeePerGas,
  network,
  lowMaxFeePerGas,
  isGasLimitEditable,
  isBtcNetwork,
  noGasLimitError
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
        isBtcNetwork={isBtcNetwork}
        noGasLimitError={noGasLimitError}
      />
    </Sheet>
  )
}

export default EditGasLimitBottomSheet
