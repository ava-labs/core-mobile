import { BIG_ZERO } from '@avalabs/core-utils-sdk'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'
import type { DefiMarket } from '../types'
import {
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS
} from '../consts'
import { getUniqueMarketId } from './getUniqueMarketId'

/**
 * On the Aave dashboard, they artificially create a market for AVAX that does not exist in reserves data.
 * Functionally, AVAX is deposited and wrapped into WAVAX as Aave only functions on ERC-20 tokens. It uses
 * the Wrapped Token Gateway (formally known as the WETH gateway) to accept AVAX, wrap it, and send it to the appropriate
 * qWAVAX deposit contract.
 * @param markets
 * @returns
 */
export const aaveInsertAvax = (
  markets: DefiMarket[],
  avaxBalance: LocalTokenWithBalance | undefined
): DefiMarket[] => {
  const wavaxMarket = markets.find(
    market => market.asset.contractAddress === AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
  )

  if (!wavaxMarket) {
    return markets
  }

  /**
   * Since AVAX and WAVAX are a mirror-match in the data,
   * we're modifying WAVAX to remove any underlying mintToken balance
   * data. This matches the Aave dashboard - if you deposit AVAX or WAVAX,
   * it shows as AVAX supplied no matter what to simplify.
   */
  const modifiedWavaxMarket = {
    ...wavaxMarket,
    asset: {
      ...wavaxMarket.asset,
      mintTokenBalance: {
        balance: 0n,
        formatted: BIG_ZERO,
        balanceValue: {
          value: BIG_ZERO,
          valueString: '0',
          currencyCode: CurrencyCode.USD
        },
        price: {
          value: BIG_ZERO,
          valueString: '0',
          currencyCode: CurrencyCode.USD
        }
      }
    }
  }

  const marketsWithoutWavax = markets.filter(
    market => market.asset.contractAddress !== AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
  )

  const avaxMarket: DefiMarket = {
    ...wavaxMarket,
    uniqueMarketId: getUniqueMarketId({
      marketName: wavaxMarket.marketName,
      asset: {
        symbol: AVALANCHE_MAINNET_NETWORK.networkToken.symbol,
        mintTokenAddress: AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS
      }
    }),
    asset: {
      ...wavaxMarket.asset,
      contractAddress: undefined,
      iconUrl: AVALANCHE_MAINNET_NETWORK.logoUri,
      assetName: AVALANCHE_MAINNET_NETWORK.networkToken.name,
      symbol: AVALANCHE_MAINNET_NETWORK.networkToken.symbol,
      decimals: AVALANCHE_MAINNET_NETWORK.networkToken.decimals,
      mintTokenAddress: AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS,
      underlyingTokenBalance: avaxBalance
    }
  }

  return [avaxMarket, modifiedWavaxMarket, ...marketsWithoutWavax]
}
