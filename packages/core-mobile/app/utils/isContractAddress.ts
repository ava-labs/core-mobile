import { Network } from '@avalabs/chains-sdk'
import { getEvmProvider } from 'services/network/utils/providerUtils'

export async function isContractAddress(
  address: string,
  network: Network
): Promise<boolean> {
  const provider = getEvmProvider(network)
  const code = await provider.getCode(address)

  return code !== '0x'
}
