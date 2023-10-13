import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  erc20PathToken,
  SwapExactTokensForTokenDisplayValues
} from 'screens/rpc/util/types'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { Network } from '@avalabs/chains-sdk'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { FindToken } from './utils/useFindToken'

export interface SwapExactTokensForTokenData {
  amountInMin: bigint
  amountIn: bigint
  amountInMax: bigint

  amountOutMin: bigint
  amountOut: bigint
  amountOutMax: bigint

  contractCall: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS
  deadline: string
  path: string[]
  to: string
}

export async function swapTokensForTokens(
  findToken: FindToken,
  network: Network,
  /**
   * The from on request represents the wallet and the to represents the contract
   */
  request: TransactionParams,
  /**
   * Data is the values sent to the above contract and this is the instructions on how to
   * execute
   */
  data: SwapExactTokensForTokenData,
  props: DisplayValueParserProps
): Promise<SwapExactTokensForTokenDisplayValues> {
  const firstTokenInPath = data.path[0]
  const lastTokenInPath = data.path[data.path.length - 1]

  const path: erc20PathToken[] = await Promise.all(
    data.path.map(async address => {
      const pathToken = await findToken(address.toLowerCase())

      if (
        pathToken.address.toLowerCase() === firstTokenInPath?.toLowerCase() &&
        pathToken.decimals
      ) {
        const amount: bigint =
          data.amountInMin || data.amountIn || data.amountInMax
        const bn = hexToBN(amount.toString(16))
        const amountValue = bigToLocaleString(
          bnToBig(bn, pathToken.decimals),
          4
        )
        const amountUSDValue =
          (Number(pathToken.priceInCurrency) * Number(amountValue)).toFixed(
            2
          ) ?? ''

        return {
          ...pathToken,
          amountIn: {
            bn,
            value: amountValue
          },
          amountUSDValue
        }
      }

      if (
        pathToken.address.toLowerCase() === lastTokenInPath?.toLowerCase() &&
        pathToken.decimals
      ) {
        const amount = data.amountOutMin || data.amountOut || data.amountOutMax
        const bn = hexToBN(amount.toString(16))
        const amountValue = bigToLocaleString(
          bnToBig(bn, pathToken.decimals),
          4
        )
        const amountUSDValue =
          (Number(pathToken.priceInCurrency) * Number(amountValue)).toFixed(
            2
          ) ?? ''

        return {
          ...pathToken,
          amountOut: {
            bn,
            value: amountValue
          },
          amountUSDValue
        }
      }
      return pathToken
    })
  )

  return {
    path,
    contractType: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
    ...parseDisplayValues(network, request, props)
  }
}

export const SwapExactTokensForTokenParser: ContractParser = [
  ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
  swapTokensForTokens
]

/**
 * This is for swaps from a token into a stable coin, same logic
 * its just telling the contract that the latter token needs to be
 * exact amount
 */
export const SwapTokensForExactTokensParser: ContractParser = [
  ContractCall.SWAP_TOKENS_FOR_EXACT_TOKENS,
  swapTokensForTokens
]
