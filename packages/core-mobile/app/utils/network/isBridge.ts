import { NULL_ADDRESS } from 'screens/bridge/utils/bridgeUtils'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'

export const isBridge = (address: string): boolean => {
  const bridgeAddresses = [
    ...UnifiedBridgeService.getBridgeAddresses().map(item =>
      item.toLowerCase()
    ),
    NULL_ADDRESS
  ]
  return bridgeAddresses.includes(address.toLowerCase())
}
