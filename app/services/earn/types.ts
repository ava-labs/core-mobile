import { Account } from 'store/account'
import { Avax } from 'types/Avax'

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
}

export type UnixTimeMs = number

export type CollectTokensForStakingParams = {
  cChainBalance: Avax
  requiredAmount: Avax
  activeAccount: Account
  isDevMode: boolean
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

export type StakingBalanceType = { type: StakeTypeEnum; amount: number }

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
  ImportCFinish
}
