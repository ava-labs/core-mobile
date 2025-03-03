import type { PriceChangeStatus } from '@avalabs/k2-alpine'
import { LocalTokenWithBalance } from 'store/balance'
import IconTxTypeAdd from '../../../assets/icons/transaction-types/add.svg'
import IconTxTypeAdvanceTime from '../../../assets/icons/transaction-types/advance-time.svg'
import IconTxTypeAirdrop from '../../../assets/icons/transaction-types/airdrop.svg'
import IconTxTypeApprove from '../../../../assets/icons/transaction-types/approve.svg'
import IconTxTypeContractCall from '../../../assets/icons/transaction-types/contract-call.svg'
import IconTxTypeReceive from '../../../assets/icons/transaction-types/receive.svg'
import IconTxTypeSend from '../../../assets/icons/transaction-types/send.svg'
import IconTxTypeSwap from '../../../assets/icons/transaction-types/swap-transfer.svg'
import IconTxTypeBridge from '../../../assets/icons/transaction-types/transaction-bridge.svg'
import IconTxTypeSubnet from '../../../assets/icons/transaction-types/transaction-subnet.svg'
import IconTxTypeUnwrap from '../../../assets/icons/transaction-types/unwrap.svg'
import IconTxTypeUnknown from '../../../assets/icons/transaction-types/unknown.svg'
import IconTxTypeExport from '../../../assets/icons/transaction-types/export.svg'
import IconTxTypeImport from '../../../assets/icons/transaction-types/import.svg'
import IconTxTypeStake from '../../../assets/icons/transaction-types/stake.svg'

export interface TokenListViewProps {
  token: LocalTokenWithBalance
  index: number
  formattedBalance: string
  onPress: () => void
  formattedPrice: string
  priceChangeStatus: PriceChangeStatus
}

export const TransactionTypes = {
  Add: IconTxTypeAdd,
  AdvanceTime: IconTxTypeAdvanceTime,
  Airdrop: IconTxTypeAirdrop,
  Approve: IconTxTypeApprove,
  ContractCall: IconTxTypeContractCall,
  Receive: IconTxTypeReceive,
  Send: IconTxTypeSend,
  Swap: IconTxTypeSwap,
  Bridge: IconTxTypeBridge,
  Subnet: IconTxTypeSubnet,
  Unwrap: IconTxTypeUnwrap,
  Unknown: IconTxTypeUnknown,
  Export: IconTxTypeExport,
  Import: IconTxTypeImport,
  Stake: IconTxTypeStake
}
