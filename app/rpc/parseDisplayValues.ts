import { GasPrice } from 'utils/GasPriceHook'
import {
  AvaxWithBalance,
  ERC20WithBalance
} from '@avalabs/wallet-react-components'
import * as ethers from 'ethers'
import { bigToLocaleString, bnToBig, hexToBN } from '@avalabs/utils-sdk'
import { BN } from 'avalanche'

export interface RpcTxParams {
  from: string
  to: string
  value?: string
  data?: string
  gas?: string
  gasPrice?: string
}

export interface DisplayValueParserProps {
  gasPrice: GasPrice
  erc20Tokens: ERC20WithBalance[]
  avaxToken: AvaxWithBalance
  avaxPrice: number
  site: DomainMetadata
}

export interface DomainMetadata {
  domain: string
  name?: string
  icon?: string
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
    displayValue = `Deposiging ${bigToLocaleString(big, 18)}`
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
