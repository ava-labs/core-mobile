import { bigToLocaleString, bnToBig } from '@avalabs/avalanche-wallet-sdk'
import { BigNumber } from 'ethers'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { hexToBN } from '@avalabs/utils-sdk'
import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  RpcTxParams,
  SwapExactTokensForTokenDisplayValues
} from 'screens/rpc/util/types'
import { findToken } from './utils/findToken'

export interface SwapExactTokensForAVAXData {
  amountOutMin: BigNumber
  amountIn: BigNumber
  contractCall: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS
  deadline: string
  path: string[]
  to: string
}

export async function swapExactTokensForAvax(
  /**
   * The from on request represents the wallet and the to represents the contract
   */
  request: RpcTxParams,
  /**
   * Data is the values sent to the above contract and this is the instructions on how to
   * execute
   */
  data: SwapExactTokensForAVAXData,
  props: DisplayValueParserProps
): Promise<SwapExactTokensForTokenDisplayValues> {
  const firstTokenInPath = await findToken(data.path[0].toLowerCase())
  const lastTokenAmountBN = hexToBN(
    (data.amountIn || data.amountOutMin).toHexString()
  )
  const amountValue = bigToLocaleString(
    bnToBig(lastTokenAmountBN, firstTokenInPath.denomination),
    4
  )
  const amountUSDValue =
    (Number(firstTokenInPath.priceUSD) * Number(amountValue)).toFixed(2) ?? ''

  const tokenSwapped = {
    ...firstTokenInPath,
    amountIn: {
      bn: lastTokenAmountBN,
      value: amountValue
    },
    amountUSDValue
  }

  const avaxAmountInBN = hexToBN(data.amountOutMin.toHexString())
  const amountAvaxValue = bigToLocaleString(bnToBig(avaxAmountInBN, 18), 4)

  const avaxToken = {
    ...props.avaxToken,
    amountOut: {
      bn: avaxAmountInBN,
      value: amountAvaxValue
    },
    amountUSDValue:
      (Number(props.avaxPrice) * Number(amountAvaxValue)).toFixed(2) ?? ''
  }

  const result = {
    path: [tokenSwapped, avaxToken],
    contractType: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
    ...parseDisplayValues(request, props)
  }

  return result
}

export const SwapExactTokensForAvaxParser: ContractParser = [
  ContractCall.SWAP_EXACT_TOKENS_FOR_AVAX,
  swapExactTokensForAvax
]
