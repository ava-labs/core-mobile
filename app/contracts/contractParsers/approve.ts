import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { TransactionDescription } from '@ethersproject/abi'
import { FindToken } from 'contracts/contractParsers/utils/useFindToken'
import { Network } from '@avalabs/chains-sdk'
import { ethers } from 'ethers'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction'

export async function approveTxHandler(
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
  data: ethers.utils.Result,
  props: DisplayValueParserProps,
  description?: TransactionDescription
): Promise<TransactionDisplayValues> {
  const tokenToBeApproved = await findToken(request.to.toLowerCase())

  return {
    tokenToBeApproved,
    contractType: ContractCall.APPROVE,
    approveData: {
      // in erc20 contracts the approve is has the limit as second parameter however it's not always named the same
      // eg JOE uses the standard namig: `approve(spender, amount)`
      // while PNG uses something else: `approve(spender, rawAmount)`
      limit: data[1]?.toHexString(),
      spender: data.spender
    },
    ...parseDisplayValues(network, request, props, description)
  }
}

export const ApproveTxParser: ContractParser = [
  ContractCall.APPROVE,
  approveTxHandler
]
