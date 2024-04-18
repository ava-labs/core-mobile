import {
  Address,
  APIError,
  BuildOptions,
  ParaSwap,
  PriceString,
  Transaction
} from 'paraswap'
import { ChainId } from '@avalabs/chains-sdk'
import Web3 from 'web3'
import { OptimalRate } from 'paraswap-core'

export type BuildTxParams = {
  network: string
  srcToken: Address
  destToken: Address
  srcAmount: PriceString
  destAmount: PriceString
  priceRoute: OptimalRate
  userAddress: Address
  partner?: string
  partnerAddress?: string
  partnerFeeBps?: number
  receiver?: Address
  options?: BuildOptions
  srcDecimals?: number
  destDecimals?: number
  permit?: string
  deadline?: string
}

const paraSwap = new ParaSwap(
  ChainId.AVALANCHE_MAINNET_ID,
  undefined,
  new Web3()
)

export async function buildTx({
  network,
  srcToken,
  destToken,
  srcAmount,
  destAmount,
  priceRoute,
  userAddress,
  partner,
  partnerAddress,
  partnerFeeBps,
  receiver,
  options,
  srcDecimals,
  destDecimals,
  permit,
  deadline
}: BuildTxParams): Promise<APIError | Transaction> {
  const query = new URLSearchParams(options as Record<string, string>)
  const txURL = `${
    (paraSwap as any).apiURL
  }/transactions/${network}/?${query.toString()}`
  const txConfig = {
    priceRoute,
    srcToken,
    destToken,
    srcAmount,
    destAmount,
    userAddress,
    partner,
    partnerAddress,
    partnerFeeBps,
    receiver,
    srcDecimals,
    destDecimals,
    permit,
    deadline
  }

  const response = await fetch(txURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(txConfig)
  })
  return await response.json()
}

export async function getParaswapSpender(): Promise<string> {
  const response = await fetch(
    `${(paraSwap as any).apiURL}/adapters/contracts?network=${
      ChainId.AVALANCHE_MAINNET_ID
    }`
  )

  const result = await response.json()
  return result.TokenTransferProxy
}
