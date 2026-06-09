import { pvm } from '@avalabs/avalanchejs'
import { PvmCapableAccount } from 'common/hooks/send/utils/types'
import { AdditionalDelegatorOutput } from 'services/wallet/types'

export type AddDelegatorTransactionProps = {
  account: PvmCapableAccount
  // Id of the node to delegate. starts with “NodeID-”
  nodeId: string
  //Amount to be delegated in nAVAX
  stakeAmountNanoAvax: bigint
  // The Date time when the delegation starts.
  startDate: Date
  // The Date time when the delegation ends.
  endDate: Date
  isTestnet: boolean
  feeState?: pvm.FeeState
  pFeeAdjustmentThreshold: number
  /**
   * Optional extra outputs bundled atomically with the delegation tx.
   * Forwarded as-is to `AvalancheWalletService.createAddDelegatorTx`.
   * Used by the Fast Stake fee flow to escrow the convenience fee on the
   * same tx as the delegation itself.
   */
  additionalOutputs?: readonly AdditionalDelegatorOutput[]
}

export type UnixTimeMs = number
export type UnixTime = number

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
  GetAtomicUTXOsFailing
}
