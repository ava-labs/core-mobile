import { NULL_ADDRESS } from 'screens/bridge/utils/bridgeUtils'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'

export const isBridge = (address: string): boolean => {
  return [
    NULL_ADDRESS,
    ...UnifiedBridgeService.getBridgeAddresses().map(item => item.toLowerCase())
  ].includes(address.toLowerCase())
}
