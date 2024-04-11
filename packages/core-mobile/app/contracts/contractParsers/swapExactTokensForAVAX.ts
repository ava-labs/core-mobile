import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  SwapExactTokensForTokenDisplayValues
} from 'screens/rpc/util/types'
import { Network } from '@avalabs/chains-sdk'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { FindToken } from './utils/useFindToken'

export interface SwapExactTokensForAVAXData {
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

export async function swapTokensForAvax(
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
  data: SwapExactTokensForAVAXData,
  props: DisplayValueParserProps
): Promise<SwapExactTokensForTokenDisplayValues> {
  const firstTokenInPath = await findToken(data.path[0]?.toLowerCase() ?? '')

  const lastTokenAmountBN = hexToBN(
    (data.amountInMin || data.amountIn || data.amountInMax).toString(16)
  )

  const amountValue = bigToLocaleString(
    bnToBig(lastTokenAmountBN, firstTokenInPath.decimals),
    4
  )
  const amountUSDValue =
    (Number(firstTokenInPath.priceInCurrency) * Number(amountValue)).toFixed(
      2
    ) ?? ''

  const tokenSwapped = {
    ...firstTokenInPath,
    amountIn: {
      bn: lastTokenAmountBN,
      value: amountValue
    },
    amountUSDValue
  }

  const avaxAmountInBN = hexToBN(
    (data.amountOutMin || data.amountOut || data.amountOutMax).toString(16)
  )
  const amountAvaxValue = bigToLocaleString(bnToBig(avaxAmountInBN, 18), 4)

  const avaxToken = {
    ...props.token,
    amountOut: {
      bn: avaxAmountInBN,
      value: amountAvaxValue
    },
    amountUSDValue:
      (Number(props.tokenPrice) * Number(amountAvaxValue)).toFixed(2) ?? ''
  }

  return {
    path: [tokenSwapped, avaxToken],
    contractType: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
    ...parseDisplayValues(network, request, props)
  }
}

export const SwapExactTokensForAvaxParser: ContractParser = [
  ContractCall.SWAP_EXACT_TOKENS_FOR_AVAX,
  swapTokensForAvax
]

export const SwapTokensForExactAvaxParser: ContractParser = [
  ContractCall.SWAP_TOKENS_FOR_EXACT_AVAX,
  swapTokensForAvax
]
