import { BigNumber } from 'ethers'
import {
  AddLiquidityDisplayData,
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  LiquidityPoolToken
} from 'screens/rpc/util/types'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import { FindToken } from 'contracts/contractParsers/utils/useFindToken'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { Network } from '@avalabs/chains-sdk'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction'

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
  data: AddLiquidityData,
  props: DisplayValueParserProps
): Promise<AddLiquidityDisplayData> {
  const tokenA = await findToken(data.tokenA.toLowerCase())
  const tokenB = await findToken(data.tokenB.toLowerCase())

  const firstTokenAmountDepositedDisplayValue = bigToLocaleString(
    bnToBig(hexToBN(data.amountADesired.toHexString()), tokenA.decimals),
    4
  )
  const tokenA_AmountUSDValue =
    (
      Number(tokenA.priceInCurrency) *
      Number(firstTokenAmountDepositedDisplayValue)
    ).toFixed(2) ?? ''
  const firstToken: LiquidityPoolToken = {
    ...tokenA,
    amountDepositedDisplayValue: firstTokenAmountDepositedDisplayValue,
    amountCurrencyValue: tokenA_AmountUSDValue
  }

  const secondTokenAmountDepositedDisplayValue = bigToLocaleString(
    bnToBig(hexToBN(data.amountBDesired.toString()), tokenB.decimals),
    4
  )
  const tokenB_AmountUSDValue =
    (
      Number(tokenB.priceInCurrency) *
      Number(secondTokenAmountDepositedDisplayValue)
    ).toFixed(2) ?? ''
  const secondToken: LiquidityPoolToken = {
    ...tokenB,
    amountDepositedDisplayValue: secondTokenAmountDepositedDisplayValue,
    amountCurrencyValue: tokenB_AmountUSDValue
  }

  const result = {
    poolTokens: [firstToken, secondToken],
    contractType: ContractCall.ADD_LIQUIDITY,
    ...parseDisplayValues(network, request, props)
  }

  return result
}

export const AddLiquidityParser: ContractParser = [
  ContractCall.ADD_LIQUIDITY,
  addLiquidityHandler
]
