import type {
  NetworkContractToken,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import { TokenVisibility } from 'store/portfolio'
import { isTokenMalicious } from 'utils/isTokenMalicious'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { getLastTransactedNetworks } from 'new/common/utils/getLastTransactedNetworks'
import { uniqBy } from 'lodash'
import { LocalTokenWithBalance } from './types'

const UPDATE_PERIOD = 15

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  return 'address' in token ? token.address : `${token.name}${token.symbol}`
}

export function isTokenVisible(
  tokenVisibility: TokenVisibility,
  token: LocalTokenWithBalance
): boolean {
  const isMalicious = isTokenMalicious(token)
  const tokenVisible = tokenVisibility[token.localId.toLowerCase()]
  return tokenVisible !== undefined ? tokenVisible : !isMalicious
}

const PRIMARY_TESTNET_CHAIN_IDS = [
  ChainId.AVALANCHE_TESTNET_ID,
  ChainId.ETHEREUM_TEST_SEPOLIA,
  ChainId.BITCOIN_TESTNET,
  ChainId.AVALANCHE_TEST_P
]

const PRIMARY_MAINNET_CHAIN_IDS = [
  ChainId.AVALANCHE_MAINNET_ID,
  ChainId.ETHEREUM_HOMESTEAD,
  ChainId.BITCOIN,
  ChainId.AVALANCHE_P
]

/**
 * @description Returns the list of networks to fetch based on the current iteration and the enabled networks.
 * @param enabledNetworks - The list of enabled networks.
 */
export function getNetworksToFetch({
  enabledNetworks,
  isDeveloperMode,
  iteration,
  allNetworksIteration,
  pullPrimaryNetworks,
  address
}: {
  enabledNetworks: Network[]
  isDeveloperMode: boolean
  iteration: number
  allNetworksIteration: number
  pullPrimaryNetworks: boolean
  address: string
}): Network[] {
  const primaryNetworksToFetch = getPrimaryNetworksToFetch({
    isDeveloperMode,
    enabledNetworks
  })
  const primaryNetworkIndex = iteration % primaryNetworksToFetch.length
  const nonPrimaryNetworksToFetch = getNonPrimaryNetworksToFetch(
    address,
    isDeveloperMode,
    enabledNetworks
  )

  // Always load all networks for the first request.
  if (iteration === 0) {
    return [...primaryNetworksToFetch, ...nonPrimaryNetworksToFetch]
  }

  return pullPrimaryNetworks
    ? primaryNetworksToFetch[primaryNetworkIndex]
      ? [primaryNetworksToFetch[primaryNetworkIndex]]
      : []
    : getNetworksToUpdate(
        nonPrimaryNetworksToFetch,
        allNetworksIteration,
        UPDATE_PERIOD
      )
}

export const getPrimaryNetworksToFetch = ({
  enabledNetworks,
  isDeveloperMode
}: {
  enabledNetworks: Network[]
  isDeveloperMode: boolean
}): Network[] => {
  return enabledNetworks.filter(network =>
    isDeveloperMode
      ? PRIMARY_TESTNET_CHAIN_IDS.includes(network.chainId)
      : PRIMARY_MAINNET_CHAIN_IDS.includes(network.chainId)
  )
}

const getNonPrimaryNetworksToFetch = (
  address: string,
  isDeveloperMode: boolean,
  enabledNetworks: Network[]
): Network[] => {
  const lastTransactedNetworks = getLastTransactedNetworks(address)
  const allNetworks = uniqBy(
    [...Object.values(lastTransactedNetworks), ...enabledNetworks],
    'chainId'
  )

  const nonPrimaryNetworks = allNetworks.filter(
    network =>
      !PRIMARY_TESTNET_CHAIN_IDS.includes(network.chainId) &&
      !PRIMARY_MAINNET_CHAIN_IDS.includes(network.chainId)
  )

  return nonPrimaryNetworks.filter(
    network => network.isTestnet === isDeveloperMode
  )
}

const getNetworksToUpdate = (
  networks: Network[],
  iteration: number,
  updatePeriod: number
): Network[] => {
  const numberOfNetworksToUpdate = Math.ceil(networks.length / updatePeriod)

  const roundsWithUpdates = Math.ceil(
    networks.length / numberOfNetworksToUpdate
  )

  if (iteration % updatePeriod < roundsWithUpdates) {
    const startIndex =
      ((iteration % updatePeriod) * numberOfNetworksToUpdate) % networks.length

    return networks.slice(startIndex, startIndex + numberOfNetworksToUpdate)
  }
  return []
}

/**
 * In production:
 *  - Update balances for all networks and accounts every
 *    [primary network size * 1000 * (primary network size + 1)] seconds
 *  - Update balances for primary networks every [testnet network size * 1000] seconds
 *
 * In development:
 *  - Update balances for all networks and accounts every
 *    [primary network size * 3000 * (primary network size + 1)]] seconds
 *  - Update balances for primary networks every [testnet network size * 3000] seconds
 */
export const getPollingConfig = ({
  isDeveloperMode,
  enabledNetworks
}: {
  isDeveloperMode: boolean
  enabledNetworks: Network[]
}): {
  allNetworks: number
  primaryNetworks: number
} => {
  const devInterval = 10000
  const prodInterval = 1000

  const primaryNetworksToFetch = getPrimaryNetworksToFetch({
    isDeveloperMode,
    enabledNetworks
  })

  // polling interval based on the number of primary networks
  // 4 seconds for primary networks size of 4, 20 seconds for all networks
  const primaryNetworksPollingInterval =
    primaryNetworksToFetch.length * prodInterval
  const allNetworksPollingInterval =
    primaryNetworksPollingInterval * (primaryNetworksToFetch.length + 1)

  const primaryTestnetNetworksPollingInterval =
    primaryNetworksToFetch.length * devInterval
  const allTestnetNetworksPollingInterval =
    primaryTestnetNetworksPollingInterval * (primaryNetworksToFetch.length + 1)

  return __DEV__
    ? {
        allNetworks: allTestnetNetworksPollingInterval,
        primaryNetworks: primaryTestnetNetworksPollingInterval
      }
    : {
        allNetworks: allNetworksPollingInterval,
        primaryNetworks: primaryNetworksPollingInterval
      }
}
