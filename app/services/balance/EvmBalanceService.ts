import { ethers } from 'ethers'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { InfuraProvider } from '@ethersproject/providers'
import {
  balanceToDisplayValue,
  bigToBN,
  ethersBigNumberToBig
} from '@avalabs/utils-sdk'
import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20
} from 'store/balance'
import {
  Network,
  NetworkContractToken,
  NetworkVMType
} from '@avalabs/chains-sdk'
import {
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import { getInstance } from 'services/token/TokenService'
import { BalanceServiceProvider } from 'services/balance/types'
import NetworkService from 'services/network/NetworkService'
import { Transaction } from '@sentry/types'
import SentryWrapper from 'services/sentry/SentryWrapper'

const hstABI = require('human-standard-token-abi')

type Provider = JsonRpcBatchInternal | InfuraProvider

const DEFAULT_DECIMALS = 18

export class EvmBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    return network.vmName === NetworkVMType.EVM
  }

  async getBalances(
    network: Network,
    userAddress: string,
    currency: string,
    sentryTrx?: Transaction
  ): Promise<(NetworkTokenWithBalance | TokenWithBalanceERC20)[]> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.evm.get')
      .executeAsync(async () => {
        const tokenService = getInstance()
        const activeTokenList = network.tokens ?? []
        const tokenAddresses = activeTokenList.map(token => token.address)
        const provider = NetworkService.getProviderForNetwork(
          network
        ) as JsonRpcBatchInternal & BlockCypherProvider

        const assetPlatformId =
          network.pricingProviders?.coingecko?.assetPlatformId ?? ''

        const tokenPriceDict =
          (assetPlatformId &&
            (await tokenService.getPricesWithMarketDataByAddresses(
              tokenAddresses,
              assetPlatformId,
              currency as VsCurrencyType
            ))) ||
          {}

        const nativeToken = await this.getNativeTokenBalance(
          provider,
          userAddress,
          network,
          currency
        )

        const erc20Tokens = await this.getErc20Balances(
          provider,
          activeTokenList,
          tokenPriceDict,
          userAddress,
          currency
        )

        return [nativeToken, ...erc20Tokens]
      })
  }

  private async getNativeTokenBalance(
    provider: Provider,
    userAddress: string,
    network: Network,
    currency: string
  ): Promise<NetworkTokenWithBalance> {
    const tokenService = getInstance()
    const { networkToken } = network
    const tokenDecimals = networkToken.decimals ?? DEFAULT_DECIMALS
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const balanceEthersBig = await provider.getBalance(userAddress)

    const {
      price: priceInCurrency,
      marketCap,
      vol24,
      change24
    } = await tokenService.getPriceWithMarketDataByCoinId(
      nativeTokenId,
      currency as VsCurrencyType
    )

    const balanceBig = ethersBigNumberToBig(balanceEthersBig, tokenDecimals)
    const balanceNum = balanceBig.toNumber()
    const balance = bigToBN(balanceBig, tokenDecimals)
    const balanceDisplayValue = balanceToDisplayValue(balance, tokenDecimals)
    const balanceInCurrency =
      priceInCurrency && balanceNum ? priceInCurrency * balanceNum : 0
    const balanceCurrencyDisplayValue = priceInCurrency
      ? balanceBig.mul(priceInCurrency).toFixed(2)
      : '0'

    return {
      ...networkToken,
      coingeckoId: nativeTokenId,
      type: TokenType.NATIVE,
      balance,
      balanceDisplayValue,
      balanceInCurrency,
      balanceCurrencyDisplayValue,
      priceInCurrency,
      marketCap,
      vol24,
      change24
    }
  }

  private async getErc20Balances(
    provider: Provider,
    activeTokenList: NetworkContractToken[],
    tokenPriceDict: SimpleTokenPriceResponse,
    userAddress: string,
    currency: string
  ): Promise<TokenWithBalanceERC20[]> {
    return Promise.allSettled(
      activeTokenList.map(async token => {
        const tokenDecimals = token.decimals ?? DEFAULT_DECIMALS
        const tokenPrice =
          tokenPriceDict[token.address.toLowerCase()]?.[
            currency as VsCurrencyType
          ]
        const contract = new ethers.Contract(token.address, hstABI, provider)
        const balanceEthersBig = await contract.balanceOf(userAddress)
        const balanceBig = ethersBigNumberToBig(balanceEthersBig, tokenDecimals)
        const balance = bigToBN(balanceBig, tokenDecimals)
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0
        const balanceNum = balanceBig.toNumber()
        const balanceUSD = priceUSD && balanceNum ? priceUSD * balanceNum : 0
        const balanceDisplayValue = balanceToDisplayValue(
          balance,
          tokenDecimals
        )
        const balanceUsdDisplayValue = priceUSD
          ? balanceBig.mul(priceUSD).toFixed(2)
          : undefined

        return {
          ...token,
          type: TokenType.ERC20,
          balance,
          balanceDisplayValue,
          balanceInCurrency: balanceUSD,
          balanceCurrencyDisplayValue: balanceUsdDisplayValue,
          priceInCurrency: priceUSD,
          marketCap,
          change24,
          vol24
        } as TokenWithBalanceERC20
      })
    ).then(res => {
      return res.reduce<TokenWithBalanceERC20[]>((acc, result) => {
        return result.status === 'fulfilled' ? [...acc, result.value] : acc
      }, [])
    })
  }
}

export default new EvmBalanceService()
