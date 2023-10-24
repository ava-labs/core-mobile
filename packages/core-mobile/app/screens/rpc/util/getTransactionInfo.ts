import { ChainId, Network } from '@avalabs/chains-sdk'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import {
  ContractSourceCodeResponse,
  getABIForContract,
  getSourceForContract
} from '@avalabs/snowtrace-sdk'
import Logger from 'utils/Logger'
import { Interface, TransactionDescription } from 'ethers'

export function isTxDescriptionError(
  desc: TransactionDescription | { error: string }
): desc is { error: string } {
  // eslint-disable-next-line no-prototype-builtins
  return !!desc && desc.hasOwnProperty('error')
}

function parseDataWithABI(
  data: string,
  value: string,
  contractInterface: Interface
):
  | TransactionDescription
  | {
      error: string
    } {
  try {
    const txDescription = contractInterface.parseTransaction({
      data: data,
      value: value
    })
    return txDescription ? txDescription : { error: 'error decoding with abi' }
  } catch (e) {
    return { error: 'error decoding with abi' }
  }
}

export function isTransactionDescriptionError(
  description: TransactionDescription | { error: string }
) {
  return !!description && !('error' in description)
}

export async function getTxInfo(
  address: string,
  data: string,
  value: string,
  network: Network
): Promise<
  | TransactionDescription
  | {
      error: string
    }
> {
  const isMainnet = !network.isTestnet

  /**
   * We already eliminate BTC as a tx requestor so we only need to verify if we are still on a
   * avalanche net. At this point anything else would be a subnet
   */
  if (
    network.chainId !== ChainId.AVALANCHE_TESTNET_ID &&
    network.chainId !== ChainId.AVALANCHE_MAINNET_ID
  ) {
    return parseDataWithABI(data, value, new Interface(ERC20.abi))
  }

  const { result, contractSource, error } = await getAvalancheABIFromSource(
    address,
    isMainnet
  )

  if (error) return { error }

  if (contractSource?.ABI === 'Contract source code not verified') {
    return { error: 'Contract source code not verified' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isJson = (str: any) => {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }
    return true
  }

  const abi = result || contractSource?.ABI
  if (!abi || !isJson(abi)) return { error: 'unable to get abi' }
  return parseDataWithABI(data, value, new Interface(abi))
}

async function getAvalancheABIFromSource(address: string, isMainnet: boolean) {
  let contractSource: ContractSourceCodeResponse
  try {
    const response = await getSourceForContract(address, isMainnet)

    if (!response.result[0])
      throw new Error('Missing ContractSourceCodeResponse')

    contractSource = response.result[0]
  } catch (e) {
    Logger.error('error decoding with abi', e)
    return { error: 'error decoding with abi' }
  }
  const response = await (contractSource.Proxy === '1' &&
  contractSource.Implementation.length > 0
    ? getABIForContract(contractSource.Implementation, isMainnet)
    : Promise.resolve(undefined))

  return { result: response?.result, contractSource }
}
