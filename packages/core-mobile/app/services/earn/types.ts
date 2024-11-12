import { pvm } from '@avalabs/avalanchejs'
import { Account } from 'store/account'

export type AddDelegatorTransactionProps = {
  activeAccount: Account
  // Id of the node to delegate. starts with “NodeID-”
  nodeId: string
  //Amount to be delegated in nAVAX
  stakeAmount: bigint
  // The Date time when the delegation starts.
  startDate: Date
  // The Date time when the delegation ends.
  endDate: Date
  isDevMode: boolean
  isDevnet: boolean
  feeState?: pvm.FeeState
}

export type UnixTimeMs = number
export type UnixTime = number

export type CollectTokensForStakingParams = {
  /**
   * In `Wei`
   */
  cChainBalance: bigint
  /**
   * In `Wei`
   */
  requiredAmount: bigint
  activeAccount: Account
  isDevMode: boolean
  selectedCurrency: string
  feeState?: pvm.FeeState
}

export type GetAllStakesParams = {
  isTestnet: boolean
  addresses: string[]
}

export enum StakeTypeEnum {
  Available = 'Available',
  Staked = 'Staked',
  Claimable = 'Claimable'
}

export type StakingBalanceType = { type: StakeTypeEnum; amount?: number }

export enum RecoveryEvents {
  Idle,
  /**
   * Operation is about to start importing P chain
   */
  ImportPStart,
  /**
   * Operation finished importing P chain
   */
  ImportPFinish,
  /**
   * Operation is about to start importing C chain
   */
  ImportCStart,
  /**
   * Operation finished importing C chain
   */
  ImportCFinish,
  /**
   * We cannot obtain atomic UTXOs for some reason
   */
  GetAtomicUTXOsFailIng
}
