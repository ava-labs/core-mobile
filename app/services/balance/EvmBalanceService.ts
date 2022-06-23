import { ethers } from 'ethers'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { InfuraProvider } from '@ethersproject/providers'
import {
  balanceToDisplayValue,
  bigToBN,
  ethersBigNumberToBig
} from '@avalabs/utils-sdk'
import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import {
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import TokenService from './TokenService'

const hstABI = require('human-standard-token-abi')

type Provider = JsonRpcBatchInternal | InfuraProvider

const DEFAULT_DECIMALS = 18

export class EvmBalanceService {
  async getBalances(
    network: Network,
    provider: Provider,
    userAddress: string,
    currency: string
  ): Promise<TokenWithBalance[]> {
    const activeTokenList = network.tokens ?? []

    const tokenAddresses = activeTokenList.map(token => token.address)

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
      network,
      currency
    )

    //const nftStates = []
    //const nftStates = await this.getErc721Balances(userAddress)

    return [nativeToken, ...erc20Tokens]
  }

  private async getNativeTokenBalance(
    provider: Provider,
    userAddress: string,
    network: Network,
    currency: string
  ): Promise<NetworkTokenWithBalance> {
    const { networkToken, chainId } = network
    const tokenDecimals = networkToken.decimals ?? DEFAULT_DECIMALS
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const id = `${chainId}-${nativeTokenId}`
    const balanceEthersBig = await provider.getBalance(userAddress)

    const {
      price: priceInCurrency,
      marketCap,
      vol24,
      change24
    } = await TokenService.getPriceWithMarketDataByCoinId(
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
      id,
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
    network: Network,
    currency: string
  ): Promise<TokenWithBalanceERC20[]> {
    const { chainId } = network

    return Promise.allSettled(
      activeTokenList.map(async token => {
        const id = `${chainId}-${token.address}`
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
          id,
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

  // TODO add support for nft
  // private async getErc721Balances(
  //   userAddress: string
  // ): Promise<TokenWithBalanceERC721[]> {
  //   const user = new User({ baseUrl: 'https://blizzard.avax.network' })
  //   const result = await user.getNftState(userAddress)
  //   return (result.data ?? []) as any[] // TODO fit to TokenWithBalance interface
  // }
}

export default new EvmBalanceService()
