import * as ethers from 'ethers'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import { DisplayValueParserProps, RpcTxParams } from 'screens/rpc/util/types'
import { calculateGasAndFees } from 'utils/Utils'

export function isTxParams(
  params: Partial<RpcTxParams>
): params is RpcTxParams {
  return !!(params.to && params.from)
}

export function parseDisplayValues(
  request: RpcTxParams,
  props: DisplayValueParserProps,
  description?: ethers.utils.TransactionDescription
) {
  const name = description?.name
  let displayValue = ''
  if (description?.args?._amount) {
    const big = bnToBig(hexToBN(description.args?._amount?.toHexString()), 18)
    displayValue = `Depositing ${bigToLocaleString(big, 18)}`
  }

  return {
    toAddress: request.to,
    fromAddress: request.from,
    ...calculateGasAndFees({
      gasPrice: props.gasPrice,
      gasLimit: Number(request.gas),
      tokenPrice: props.avaxPrice
    }),
    site: props.site,
    description,
    name: name ? name[0].toUpperCase() + name.slice(1) : '',
    displayValue
  }
}
