import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import { DisplayValueParserProps } from 'screens/rpc/util/types'
import { calculateGasAndFees } from 'utils/Utils'
import { Network } from '@avalabs/chains-sdk'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { TransactionDescription } from 'ethers'

export function isTxParams(
  params: Partial<TransactionParams>
): params is TransactionParams {
  return !!(params.to && params.from)
}

export function parseDisplayValues(
  network: Network,
  txParams: TransactionParams,
  props: DisplayValueParserProps,
  description?: TransactionDescription
) {
  const tokenDecimals = network.networkToken.decimals
  const name = description?.name ?? description?.fragment?.name
  let displayValue = ''
  if (description?.args?.amount) {
    const big = bnToBig(
      hexToBN(description.args?.amount?.toHexString()),
      tokenDecimals
    )
    displayValue = `${bigToLocaleString(big, tokenDecimals)}`
  } else if (description?.value) {
    const big = bnToBig(hexToBN(description.value?.toString(16)), tokenDecimals)
    displayValue = `${bigToLocaleString(big, tokenDecimals)}`
  }

  /**
   * to: contract this tx is being sent to
   * from: wallet account being sent from
   */
  return {
    toAddress: txParams.to,
    fromAddress: txParams.from,
    ...calculateGasAndFees({
      gasPrice: props.gasPrice,
      gasLimit: txParams.gas,
      tokenPrice: props.tokenPrice,
      tokenDecimals
    }),
    site: props.site,
    description,
    name: name && name.length > 0 ? name[0]?.toUpperCase() + name.slice(1) : '',
    displayValue
  }
}
