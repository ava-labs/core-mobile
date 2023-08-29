import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  erc20PathToken,
  SwapExactTokensForTokenDisplayValues
} from 'screens/rpc/util/types'
import { Network } from '@avalabs/chains-sdk'
import BN from 'bn.js'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { FindToken } from './utils/useFindToken'

export interface SwapAVAXForExactTokensData {
  /**
   * Depending on function call one of these amounts will be truthy
   */
  amountOutMin: bigint
  amountOut: bigint
  contractCall: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS
  deadline: string
  path: string[]
  to: string
}

export async function swapAVAXForTokens(
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
  data: SwapAVAXForExactTokensData,
  props: DisplayValueParserProps
): Promise<SwapExactTokensForTokenDisplayValues> {
  const avaxAmountInBN = request.value ? hexToBN(request.value) : new BN(0)
  const amountAvaxValue = bigToLocaleString(bnToBig(avaxAmountInBN, 18), 4)
  const amountAvaxCurrency =
    (Number(props.avaxPrice) * Number(amountAvaxValue)).toFixed(2) ?? ''
  const avaxToken: erc20PathToken = {
    ...props.avaxToken,
    amountIn: {
      bn: avaxAmountInBN,
      value: amountAvaxValue
    },
    amountCurrencyValue: amountAvaxCurrency
  }

  const lastTokenInPath = await findToken(
    data.path[data.path.length - 1]?.toLowerCase() ?? ''
  )
  const lastTokenAmountBN = hexToBN(
    (data.amountOut || data.amountOutMin).toString(16)
  )
  const amountValue = bigToLocaleString(
    bnToBig(lastTokenAmountBN, lastTokenInPath?.decimals),
    4
  )
  const amountUSDValue =
    (Number(lastTokenInPath?.priceInCurrency) * Number(amountValue)).toFixed(
      2
    ) ?? ''

  const tokenReceived = {
    ...lastTokenInPath,
    amountOut: {
      bn: lastTokenAmountBN,
      value: amountValue
    },
    amountUSDValue
  }

  return {
    path: [avaxToken, tokenReceived],
    contractType: ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS,
    ...parseDisplayValues(network, request, props)
  }
}

export const SwapAvaxForExactTokensParser: ContractParser = [
  ContractCall.SWAP_AVAX_FOR_EXACT_TOKENS,
  swapAVAXForTokens
]

export const SwapExactAvaxForTokensParser: ContractParser = [
  ContractCall.SWAP_EXACT_AVAX_FOR_TOKENS,
  swapAVAXForTokens
]
