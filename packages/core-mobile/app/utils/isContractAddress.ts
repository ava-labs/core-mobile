import { Network } from '@avalabs/chains-sdk'
import { getEvmProvider } from 'services/network/utils/providerUtils'

/**
 * Determines if a given address is a contract address on the specified network.
 *
 * This function checks whether the provided address is a smart contract address
 * or a regular externally owned address (EOA) by querying the Ethereum Virtual
 * Machine (EVM) for the code associated with the address. If the address has code
 * (i.e., code is not '0x'), it is considered a contract address.
 *
 * @param {string} address - The address to check.
 * @param {Network} network - The network where the address is located.
 * @returns {Promise<boolean>} - A promise that resolves to true if the address is
 *                               a contract address, and false if it is an EOA.
 */
export async function isContractAddress(
  address: string,
  network: Network
): Promise<boolean> {
  const provider = getEvmProvider(network)
  const code = await provider.getCode(address)

  return code !== '0x'
}
