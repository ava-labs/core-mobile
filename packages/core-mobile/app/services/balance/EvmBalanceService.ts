import { InfuraProvider, ethers } from 'ethers'
import { BitcoinProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { balanceToDisplayValue, bigToBN } from '@avalabs/utils-sdk'
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
import {
  BalanceServiceProvider,
  GetBalancesParams
} from 'services/balance/types'
import NetworkService from 'services/network/NetworkService'
import SentryWrapper from 'services/sentry/SentryWrapper'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import TokenService from 'services/token/TokenService'

type Provider = JsonRpcBatchInternal | InfuraProvider

const DEFAULT_DECIMALS = 18

export class EvmBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    return network.vmName === NetworkVMType.EVM
  }

  async getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx
  }: GetBalancesParams): Promise<
    (NetworkTokenWithBalance | TokenWithBalanceERC20)[]
  > {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.evm.get')
      .executeAsync(async () => {
        const activeTokenList = network.tokens ?? []
        const tokenAddresses = activeTokenList.map(token => token.address)
        const provider = NetworkService.getProviderForNetwork(
          network
        ) as JsonRpcBatchInternal & BitcoinProvider

        const assetPlatformId =
          network.pricingProviders?.coingecko?.assetPlatformId ?? ''

        const tokenPriceDict =
          (assetPlatformId &&
            (await TokenService.getPricesWithMarketDataByAddresses(
              tokenAddresses,
              assetPlatformId,
              currency as VsCurrencyType
            ))) ||
          {}

        const nativeToken = await this.getNativeTokenBalance({
          provider,
          accountAddress,
          network,
          currency
        })

        const erc20Tokens = await this.getErc20Balances({
          provider,
          activeTokenList,
          tokenPriceDict,
          accountAddress,
          currency
        })

        return [nativeToken, ...erc20Tokens]
      })
  }

  private async getNativeTokenBalance({
    provider,
    accountAddress,
    network,
    currency
  }: {
    provider: Provider
    accountAddress: string
    network: Network
    currency: string
  }): Promise<NetworkTokenWithBalance> {
    const { networkToken } = network
    const tokenDecimals = networkToken.decimals ?? DEFAULT_DECIMALS
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const balanceBigInt = await provider.getBalance(accountAddress)

    const {
      price: priceInCurrency,
      marketCap,
      vol24,
      change24
    } = await TokenService.getPriceWithMarketDataByCoinId(
      nativeTokenId,
      currency as VsCurrencyType
    )

    const balanceBig = bigintToBig(balanceBigInt, tokenDecimals)
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

  private async getErc20Balances({
    provider,
    activeTokenList,
    tokenPriceDict,
    accountAddress,
    currency
  }: {
    provider: Provider
    activeTokenList: NetworkContractToken[]
    tokenPriceDict: SimpleTokenPriceResponse
    accountAddress: string
    currency: string
  }): Promise<TokenWithBalanceERC20[]> {
    return Promise.allSettled(
      activeTokenList.map(async token => {
        const tokenDecimals = token.decimals ?? DEFAULT_DECIMALS
        const tokenPrice =
          tokenPriceDict[token.address.toLowerCase()]?.[
            currency as VsCurrencyType
          ]
        const contract = new ethers.Contract(token.address, ERC20.abi, provider)
        const balanceBigInt = await contract.balanceOf?.(accountAddress)
        const balanceBig = bigintToBig(balanceBigInt, tokenDecimals)
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
