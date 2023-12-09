import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import { DisplayValueParserProps } from 'screens/rpc/util/types'
import { calculateGasAndFees } from 'utils/Utils'
import { Network } from '@avalabs/chains-sdk'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { TransactionDescription } from 'ethers'
import { CoreTypes } from '@walletconnect/types'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import Big from 'big.js'

interface DisplayValueTypes {
  displayValue: string
  gasLimit: number
  bnFee: bigint
  site: CoreTypes.Metadata | null | undefined
  fee: string
  feeInCurrency: number
  name: string
  description: TransactionDescription | undefined
  fromAddress: string
  toAddress: string
  gasPrice: bigint
}

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
): DisplayValueTypes {
  const tokenDecimals = network.networkToken.decimals
  const name = description?.name ?? description?.fragment?.name
  let displayValue = ''
  if (description?.args?.amount) {
    let amountBig: Big
    if (typeof description?.args?.amount === 'bigint') {
      amountBig = bigintToBig(description?.args?.amount, tokenDecimals)
    } else {
      amountBig = bnToBig(
        hexToBN(description.args?.amount?.toHexString()),
        tokenDecimals
      )
    }
    displayValue = `${bigToLocaleString(amountBig, tokenDecimals)}`
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
