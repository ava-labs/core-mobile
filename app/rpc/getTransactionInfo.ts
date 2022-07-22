import * as ethers from 'ethers'
import { Transaction as BlizzardTransaction } from '@avalabs/blizzard-sdk'

const blizzardURL = 'https://blizzard.avax-dev.network'

export function isTransactionDescriptionError(
  description: ethers.utils.TransactionDescription | { error: string }
) {
  return !!description && !('error' in description)
}

export async function getTxInfo(txParams: any, isMainnet: boolean) {
  const testTx = new BlizzardTransaction({
    baseUrl: blizzardURL
  })

  const now = new Date().getTime()

  const data = {
    ...txParams,
    network: isMainnet ? 'mainnet' : 'fuji'
  }

  console.log('explain params', data)

  return await testTx.explainTx(data)

  // let contractInterface: Interface
  // if (
  //   contractSource.Proxy === '1' &&
  //   contractSource.Implementation.length > 0
  // ) {
  //   // get the real contract's ABI since it's a proxy
  //   try {
  //     const response = await getABIForContract(
  //       contractSource.Implementation,
  //       isMainnet
  //     )
  //     console.log('getSourceForContract', response)
  //     contractInterface = new Interface(response.result)
  //     const finalResponse = contractInterface.parseTransaction({
  //       data: data,
  //       value: value
  //     })
  //
  //     console.log('finalResponse', finalResponse)
  //
  //     return finalResponse
  //   } catch (e) {
  //     console.error(e)
  //     return { error: 'error decoding with abi' }
  //   }
  // } else {
  //   try {
  //     contractInterface = new Interface(contractSource.ABI)
  //
  //     const finalResponse = contractInterface.parseTransaction({
  //       data: data,
  //       value: value
  //     })
  //
  //     console.log('finalResponse', finalResponse)
  //
  //     return finalResponse
  //   } catch (e) {
  //     console.error(e)
  //     return { error: 'error getting interface with abi' }
  //   }
  // }
}
