import { BigNumber } from 'ethers'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  erc20PathToken,
  SwapExactTokensForTokenDisplayValues,
  TransactionParams
} from 'screens/rpc/util/types'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { Network } from '@avalabs/chains-sdk'
import { TokenWithBalanceERC20 } from 'store/balance'
import { findToken } from './utils/findToken'

export interface SwapExactTokensForTokenData {
  amountInMin: BigNumber
  amountIn: BigNumber
  amountInMax: BigNumber

  amountOutMin: BigNumber
  amountOut: BigNumber
  amountOutMax: BigNumber

  contractCall: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS
  deadline: string
  path: string[]
  to: string
}

export async function swapExactTokensForTokenHandler(
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
      const pathToken: TokenWithBalanceERC20 = await findToken(
        address.toLowerCase()
      )

      if (
        pathToken.address.toLowerCase() === firstTokenInPath?.toLowerCase() &&
        pathToken.decimals
      ) {
        const amount: BigNumber =
          data.amountIn || data.amountInMax || data.amountInMax
        const bn = hexToBN(amount.toHexString())
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
        const bn = hexToBN(amount.toHexString())
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

  const result = {
    path,
    contractType: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
    ...parseDisplayValues(network, request, props)
  }

  return result
}

export const SwapExactTokensForTokenParser: ContractParser = [
  ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
  swapExactTokensForTokenHandler
]

/**
 * This is for swaps from a token into a stable coin, same logic
 * its just telling the contract that the latter token needs to be
 * exact amount
 */
export const SwapTokensForExactTokensParser: ContractParser = [
  ContractCall.SWAP_TOKENS_FOR_EXACT_TOKENS,
  swapExactTokensForTokenHandler
]
