import { bigToLocaleString, bnToBig } from '@avalabs/avalanche-wallet-sdk'
import { BigNumber } from 'ethers'
import {
  AddLiquidityDisplayData,
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  LiquidityPoolToken,
  TransactionParams
} from 'screens/rpc/util/types'
import { hexToBN } from '@avalabs/utils-sdk'
import {parseDisplayValues} from 'screens/rpc/util/parseDisplayValues';

export interface AddLiquidityAvaxData {
  amountAVAXMin: BigNumber
  amountTokenDesired: BigNumber
  amountTokenMin: BigNumber
  contractCall: ContractCall.ADD_LIQUIDITY_AVAX
  deadline: string
  token: string
  to: string
}

export async function addLiquidityAvaxHandler(
  /**
   * The from on request represents the wallet and the to represents the contract
   */
  request: TransactionParams,
  /**
   * Data is the values sent to the above contract and this is the instructions on how to
   * execute
   */
  data: AddLiquidityAvaxData,
  props: DisplayValueParserProps
): Promise<AddLiquidityDisplayData> {
  const erc20sIndexedByAddress = props.erc20Tokens.reduce(
    (acc, token) => ({ ...acc, [token.address.toLowerCase()]: token }),
    {}
  )

  // @ts-ignore
  const token = erc20sIndexedByAddress[data.token.toLowerCase()]
  const firstTokenDeposited = bigToLocaleString(
    bnToBig(hexToBN(data.amountAVAXMin.toString()), 18),
    4
  )
  const firstToken_AmountUSDValue =
    (Number(props.avaxPrice) * Number(firstTokenDeposited)).toFixed(2) ?? ''

  const firstToken: LiquidityPoolToken = {
    ...props.avaxToken,
    amountDepositedDisplayValue: firstTokenDeposited,
    amountUSDValue: firstToken_AmountUSDValue
  }

  const secondTokenDeposited = bigToLocaleString(
    bnToBig(hexToBN(data.amountTokenDesired.toHexString()), token.denomination),
    4
  )
  const secondToken_AmountUSDValue =
    (Number(token.priceUSD) * Number(secondTokenDeposited)).toFixed(2) ?? ''

  const secondToken: LiquidityPoolToken = {
    ...token,
    amountDepositedDisplayValue: secondTokenDeposited,
    amountUSDValue: secondToken_AmountUSDValue
  }
  const result = {
    poolTokens: [firstToken, secondToken],
    contractType: ContractCall.ADD_LIQUIDITY_AVAX,
    ...parseDisplayValues(request, props)
  }

  return result
}

export const AddLiquidityAvaxParser: ContractParser = [
  ContractCall.ADD_LIQUIDITY_AVAX,
  addLiquidityAvaxHandler
]
