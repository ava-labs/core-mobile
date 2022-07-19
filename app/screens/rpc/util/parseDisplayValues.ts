import * as ethers from 'ethers'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import {
  DisplayValueParserProps,
  TransactionParams
} from 'screens/rpc/util/types'
import { calculateGasAndFees } from 'utils/Utils'

export function isTxParams(
  params: Partial<TransactionParams>
): params is TransactionParams {
  return !!(params.to && params.from)
}

export function parseDisplayValues(
  request: TransactionParams,
  props: DisplayValueParserProps,
  description?: ethers.utils.TransactionDescription
) {
  const name = description?.name
  let displayValue = ''
  if (description?.args?.amount) {
    const big = bnToBig(hexToBN(description.args?.amount?.toHexString()), 18)
    displayValue = `- ${bigToLocaleString(big, 18)}`
  } else if (description?.value) {
    const big = bnToBig(hexToBN(description.value?.toHexString()), 18)
    displayValue = `- ${bigToLocaleString(big, 18)}`
  }

  return {
    toAddress: request.to,
    fromAddress: request.from,
    ...calculateGasAndFees({
      gasPrice: props.gasPrice,
      gasLimit: request.gas,
      tokenPrice: props.avaxPrice
    }),
    site: props.site,
    description,
    name: name ? name[0].toUpperCase() + name.slice(1) : '',
    displayValue
  }
}
