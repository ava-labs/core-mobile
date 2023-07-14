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
}

export type UnixTimeMs = number
