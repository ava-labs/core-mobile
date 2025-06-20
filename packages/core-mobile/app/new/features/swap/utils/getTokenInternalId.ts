import { LocalTokenWithBalance } from 'store/balance'

type EvmChainIdResponse = {
  chainId: number
  address: string
  internalId: string
  isNative: boolean
  logoUri: string
  name: string
  symbol: string
  decimals: number
  contractType: string
}

export async function getTokenInternalId(
  token: LocalTokenWithBalance
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://proxy-api.avax.network/tokens?evmChainId=${token.networkChainId}`
    )
    const result = await response.json()
    return (
      result.find((item: EvmChainIdResponse) => item.address === token.address)
        ?.internalId || null
    )
  } catch (error) {
    return null
  }
}
