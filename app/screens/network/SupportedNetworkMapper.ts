import {
  ActiveNetwork,
  FUJI_NETWORK,
  MAINNET_NETWORK
} from '@avalabs/wallet-react-components'

export function getActiveNetwork(
  networkName: string
): ActiveNetwork | undefined {
  if (networkName === 'Avalanche Mainnet') {
    return MAINNET_NETWORK
  } else if (networkName === 'Avalanche FUJI') {
    return FUJI_NETWORK
  } else {
    return undefined
  }
}
