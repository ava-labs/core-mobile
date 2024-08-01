import { CriticalConfig } from '@avalabs/core-bridge-sdk'

export const isBtcBridge = (
  address: string,
  bridgeConfig?: CriticalConfig
): boolean => {
  const btcBridgeAddress =
    bridgeConfig &&
    bridgeConfig.criticalBitcoin?.walletAddresses.btc?.toLowerCase()
  return btcBridgeAddress === address.toLowerCase()
}
