import { GasPrice } from 'utils/GasPriceHook'
import * as ethers from 'ethers'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import { BN } from 'avalanche'
import { DisplayValueParserProps, RpcTxParams } from 'rpc/models'

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
    ...calculateGasAndFees(
      props.gasPrice,
      request.gas as string,
      props.avaxPrice
    ),
    site: props.site,
    description,
    name: name ? name[0].toUpperCase() + name.slice(1) : '',
    displayValue
  }
}

function calculateGasAndFees(
  gasPrice: GasPrice,
  gasLimit: string,
  avaxPrice: number
) {
  const bnFee = gasPrice.bn.mul(new BN(parseInt(gasLimit)))
  const fee = bigToLocaleString(bnToBig(bnFee, 18), 4)
  return {
    gasPrice: gasPrice,
    gasLimit: parseInt(gasLimit),
    fee,
    bnFee,
    feeUSD: parseFloat((parseFloat(fee) * avaxPrice).toFixed(4))
  }
}
