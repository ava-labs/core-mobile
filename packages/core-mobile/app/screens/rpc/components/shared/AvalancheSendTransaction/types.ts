import { Avalanche } from '@avalabs/wallets-sdk'

export type AddPermissionlessDelegatorTx = Pick<
  Avalanche.AddPermissionlessDelegatorTx,
  'nodeID' | 'start' | 'end' | 'stake' | 'subnetID' | 'txFee'
>

export type AddPermissionlessValidatorTx = Pick<
  Avalanche.AddPermissionlessValidatorTx,
  | 'nodeID'
  | 'start'
  | 'end'
  | 'stake'
  | 'delegationFee'
  | 'txFee'
  | 'subnetID'
  | 'publicKey'
  | 'signature'
>

export type RemoveSubnetValidatorTx = Pick<
  Avalanche.RemoveSubnetValidatorTx,
  'nodeID' | 'subnetID' | 'txFee'
>

export type ExportTx = {
  tx: Avalanche.ExportTx
  hexData: string
  toggleActionButtons: (value: boolean) => void
}

export type ImportTx = {
  tx: Avalanche.ImportTx
  hexData: string
  toggleActionButtons: (value: boolean) => void
}
