import {
  ContractCall,
  ContractParser,
  DisplayValueParserProps,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { parseDisplayValues } from 'screens/rpc/util/parseDisplayValues'
import { FindToken } from 'contracts/contractParsers/utils/useFindToken'
import { Network } from '@avalabs/chains-sdk'
import { Result, TransactionDescription } from 'ethers'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { bigIntToHex } from '@ethereumjs/util'

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
  data: Result,
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
      limit: bigIntToHex(BigInt(data[1])),
      spender: data.spender
    },
    ...parseDisplayValues(network, request, props, description)
  }
}

export const ApproveTxParser: ContractParser = [
  ContractCall.APPROVE,
  approveTxHandler
]
