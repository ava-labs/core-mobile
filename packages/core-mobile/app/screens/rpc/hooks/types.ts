import { SpendLimit } from 'components/EditSpendLimit'
import { FeePreset } from 'components/NetworkFeeSelector'
import { NetworkTokenUnit } from 'types'
import { Eip1559Fees } from 'utils/Utils'
import { Transaction } from 'screens/rpc/util/types'
import { ContractCall, TransactionDisplayValues } from '../util/types'

export interface ExplainTransactionSharedTypes {
  setSpendLimit: (customSpendData: SpendLimit) => void
  contractType: ContractCall | undefined
  selectedGasFee: FeePreset
  displayData: TransactionDisplayValues
  setCustomFee: (
    fees: Eip1559Fees<NetworkTokenUnit>,
    modifier: FeePreset
  ) => void
  transaction: Transaction | null
  customSpendLimit: SpendLimit
}
