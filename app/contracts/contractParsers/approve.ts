import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  TransactionDisplayValues,
  TransactionParams
} from 'screens/rpc/util/types'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { TransactionDescription } from '@ethersproject/abi'
import { findToken } from 'contracts/contractParsers/utils/findToken'

export async function approveTxHandler(
  /**
   * The from on request represents the wallet and the to represents the contract
   */
  request: TransactionParams,
  /**
   * Data is the values sent to the above contract and this is the instructions on how to
   * execute
   */
  _data: any,
  props: DisplayValueParserProps,
  description?: TransactionDescription
): Promise<TransactionDisplayValues> {
  const tokenToBeApproved = await findToken(request.to.toLowerCase())

  const result = {
    tokenToBeApproved,
    contractType: ContractCall.APPROVE,
    approveData: {
      // in erc20 contracts the approve is has the limit as second parameter however it's not always named the same
      // eg JOE uses the standard namig: `approve(spender, amount)`
      // while PNG uses something else: `approve(spender, rawAmount)`
      limit: _data[1]?.toHexString(),
      spender: _data.spender
    },
    ...parseDisplayValues(request, props, description)
  }

  return result
}

export const ApproveTxParser: ContractParser = [
  ContractCall.APPROVE,
  approveTxHandler
]
