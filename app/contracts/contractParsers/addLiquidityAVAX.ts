import { BigNumber } from 'ethers'
import {
  AddLiquidityDisplayData,
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  LiquidityPoolToken,
  TransactionParams
} from 'screens/rpc/util/types'
import { bigToLocaleString, ethersBigNumberToBig } from '@avalabs/utils-sdk'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { Network } from '@avalabs/chains-sdk'
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

export async function addLiquidityAvaxHandler(
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
    ethersBigNumberToBig(data.amountADesired, tokenA.decimals),
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
    ethersBigNumberToBig(data.amountBDesired, tokenB.decimals),
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

  return {
    poolTokens: [firstToken, secondToken],
    contractType: ContractCall.ADD_LIQUIDITY,
    ...parseDisplayValues(network, request, props)
  }
}

export const AddLiquidityAvaxParser: ContractParser = [
  ContractCall.ADD_LIQUIDITY_AVAX,
  addLiquidityAvaxHandler
]
