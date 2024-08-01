import { Avalanche } from '@avalabs/core-wallets-sdk'

export function isPrimarySubnet(subnetId: string): boolean {
  return subnetId === Avalanche.MainnetContext.pBlockchainID
}
