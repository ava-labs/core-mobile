import { Avalanche } from '@avalabs/wallets-sdk'

export function isPrimarySubnet(subnetId: string): boolean {
  return subnetId === Avalanche.MainnetContext.pBlockchainID
}
