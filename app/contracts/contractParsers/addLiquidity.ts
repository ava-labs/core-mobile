import { bigToLocaleString, bnToBig } from '@avalabs/avalanche-wallet-sdk'
import { BigNumber } from 'ethers'
import {
  AddLiquidityDisplayData,
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  LiquidityPoolToken,
  parseDisplayValues,
  RpcTxParams
} from 'screens/rpc/util/parseDisplayValues'
import { hexToBN } from '@avalabs/utils-sdk'
import { findToken } from 'contracts/contractParsers/utils/findToken'

export interface AddLiquidityData {
  amountAMin: BigNumber
  amountADesired: BigNumber
  amountBMin: BigNumber
  amountBDesired: BigNumber
  contractCall: ContractCall.ADD_LIQUIDITY
  deadline: string
  tokenA: string
  tokenB: string
  to: string
}

export async function addLiquidityHandler(
  /**
   * The from on request represents the wallet and the to represents the contract
   */
  request: RpcTxParams,
  /**
   * Data is the values sent to the above contract and this is the instructions on how to
   * execute
   */
  data: AddLiquidityData,
  props: DisplayValueParserProps
): Promise<AddLiquidityDisplayData> {
  const tokenA = await findToken(data.tokenA.toLowerCase())
  const tokenB = await findToken(data.tokenB.toLowerCase())

  const firstTokenAmountDepositedDisplayValue = bigToLocaleString(
    bnToBig(hexToBN(data.amountADesired.toHexString()), tokenA.denomination),
    4
  )
  const tokenA_AmountUSDValue =
    (
      Number(tokenA.priceUSD) * Number(firstTokenAmountDepositedDisplayValue)
    ).toFixed(2) ?? ''
  const firstToken: LiquidityPoolToken = {
    ...tokenA,
    amountDepositedDisplayValue: firstTokenAmountDepositedDisplayValue,
    amountUSDValue: tokenA_AmountUSDValue
  }

  const secondTokenAmountDepositedDisplayValue = bigToLocaleString(
    bnToBig(hexToBN(data.amountBDesired.toString()), tokenB.denomination),
    4
  )
  const tokenB_AmountUSDValue =
    (
      Number(tokenB.priceUSD) * Number(secondTokenAmountDepositedDisplayValue)
    ).toFixed(2) ?? ''
  const secondToken: LiquidityPoolToken = {
    ...tokenB,
    amountDepositedDisplayValue: secondTokenAmountDepositedDisplayValue,
    amountUSDValue: tokenB_AmountUSDValue
  }

  const result = {
    poolTokens: [firstToken, secondToken],
    contractType: ContractCall.ADD_LIQUIDITY,
    ...parseDisplayValues(request, props)
  }

  return result
}

export const AddLiquidityParser: ContractParser = [
  ContractCall.ADD_LIQUIDITY,
  addLiquidityHandler
]
