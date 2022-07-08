import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  parseDisplayValues,
  RpcTxParams,
  TransactionDisplayValues
} from 'rpc/parseDisplayValues'
import { findToken } from './utils/findToken'

export async function approveTxHandler(
  /**
   * The from on request represents the wallet and the to represents the contract
   */
  request: RpcTxParams,
  /**
   * Data is the values sent to the above contract and this is the instructions on how to
   * execute
   */
  _data: any,
  props: DisplayValueParserProps
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
    ...parseDisplayValues(request, props)
  }

  return result
}

export const ApproveTxParser: ContractParser = [
  ContractCall.APPROVE,
  approveTxHandler
]
