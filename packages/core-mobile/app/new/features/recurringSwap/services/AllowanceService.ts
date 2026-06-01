import Config from 'react-native-config'
import { ERC20__factory } from 'contracts/openzeppelin'
import { getNetworksFromCache } from 'hooks/networks/utils/getNetworksFromCache'
import { getEvmProvider } from 'services/network/utils/providerUtils'

const BASE_URL = `${Config.PROXY_URL ?? ''}/proxy/markr`
const BEARER_TOKEN = Config.MARKR_API_KEY ?? ''

type SpenderAddressResponse = {
  chainId: number
  address: string
}

/**
 * Fetches the router (spender) address for a given chainId from Markr.
 * GET /spender-address?chainId=…
 * Response shape: { chainId, address }
 */
export async function fetchRouterAddress(chainId: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/spender-address?chainId=${chainId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`
    }
  })

  if (!res.ok) {
    throw new Error(
      `fetchRouterAddress: request failed with status ${res.status}`
    )
  }

  const json = (await res.json()) as SpenderAddressResponse
  return json.address
}

/**
 * Reads the ERC-20 allowance for (owner, spender) on the given chain.
 * Returns the allowance as a bigint.
 */
export async function readErc20Allowance({
  chainId,
  token,
  owner,
  spender
}: {
  chainId: number
  token: string
  owner: string
  spender: string
}): Promise<bigint> {
  const networks = getNetworksFromCache({ includeSolana: false })
  const network = networks?.[chainId]
  if (!network) {
    throw new Error(
      `readErc20Allowance: network not found for chainId ${chainId}`
    )
  }

  const provider = await getEvmProvider(network)
  const contract = ERC20__factory.connect(token, provider)
  const allowance = await contract.allowance(owner, spender)
  return BigInt(allowance)
}
