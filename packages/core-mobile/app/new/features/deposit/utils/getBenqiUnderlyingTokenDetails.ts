import { type Address, type Client, erc20Abi } from 'viem'
import { multicall, readContract } from 'viem/actions'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'
import { BENQI_Q_TOKEN } from '../abis/benqiQToken'
import { isQAvaxAddress } from './isQAvaxAddress'

export const getBenqiUnderlyingTokenDetails = async ({
  cChainClient,
  qTokenAddress
}: {
  cChainClient: Client
  qTokenAddress: Address
}): Promise<{
  underlyingTokenAddress: Address | undefined
  underlyingTokenName: string
  underlyingTokenDecimals: number
  underlyingTokenSymbol: string
}> => {
  // If qAVAX, no underlying token address to lookup
  if (isQAvaxAddress(qTokenAddress)) {
    return {
      underlyingTokenAddress: undefined,
      underlyingTokenName: AVALANCHE_MAINNET_NETWORK.networkToken.name,
      underlyingTokenDecimals: AVALANCHE_MAINNET_NETWORK.networkToken.decimals,
      underlyingTokenSymbol: AVALANCHE_MAINNET_NETWORK.networkToken.symbol
    }
  }

  const underlyingTokenAddress = await readContract(cChainClient, {
    address: qTokenAddress,
    abi: BENQI_Q_TOKEN,
    functionName: 'underlying'
  })

  const [nameCall, decimalsCall, symbolCall] = await multicall(cChainClient, {
    contracts: [
      {
        address: underlyingTokenAddress,
        abi: erc20Abi,
        functionName: 'name'
      },
      {
        address: underlyingTokenAddress,
        abi: erc20Abi,
        functionName: 'decimals'
      },
      {
        address: underlyingTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol'
      }
    ]
  })

  return {
    underlyingTokenAddress,
    underlyingTokenName: nameCall.result ?? '',
    underlyingTokenDecimals: decimalsCall.result ?? 0,
    underlyingTokenSymbol: symbolCall.result ?? ''
  }
}
