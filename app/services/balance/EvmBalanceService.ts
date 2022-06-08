import { ethers } from 'ethers'
import { User } from '@avalabs/blizzard-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { InfuraProvider } from '@ethersproject/providers'
import { currentSelectedCurrency$ } from '@avalabs/wallet-react-components'
import {
  balanceToDisplayValue,
  bigToBN,
  ethersBigNumberToBig
} from '@avalabs/utils-sdk'
import { firstValueFrom } from 'rxjs'
import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20,
  TokenWithBalanceERC721
} from 'store/balance'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import {
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import TokenService from './TokenService'

const hstABI = require('human-standard-token-abi')

type Provider = JsonRpcBatchInternal | InfuraProvider

export class EvmBalanceService {
  private async getNativeTokenBalance(
    provider: Provider,
    userAddress: string,
    network: Network,
    selectedCurrency: string
  ): Promise<NetworkTokenWithBalance> {
    const { networkToken, chainId } = network
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const id = `${chainId}-${nativeTokenId}`
    const balanceEthersBig = await provider.getBalance(userAddress)
    const {
      price: priceUSD,
      marketCap,
      vol24,
      change24
    } = await TokenService.getPriceWithMarketDataByCoinId(
      nativeTokenId,
      selectedCurrency
    )
    const balanceBig = ethersBigNumberToBig(
      balanceEthersBig,
      networkToken.decimals
    )
    const balanceNum = balanceBig.toNumber()
    const balance = bigToBN(balanceBig, networkToken.decimals)
    const balanceDisplayValue = balanceToDisplayValue(
      balance,
      networkToken.decimals
    )
    const balanceUSD = priceUSD && balanceNum ? priceUSD * balanceNum : 0
    const balanceUsdDisplayValue = priceUSD
      ? balanceBig.mul(priceUSD).toFixed(2)
      : '0'

    return {
      ...networkToken,
      id,
      coingeckoId: nativeTokenId,
      type: TokenType.NATIVE,
      balance,
      balanceDisplayValue,
      balanceUSD,
      balanceUsdDisplayValue,
      priceUSD,
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
    selectedCurrency: string
  ): Promise<TokenWithBalanceERC20[]> {
    const { chainId } = network

    return Promise.allSettled(
      activeTokenList.map(async token => {
        const id = `${chainId}-${token.address}`
        const tokenPrice =
          tokenPriceDict[token.address.toLowerCase()]?.[
            selectedCurrency as VsCurrencyType
          ]
        const contract = new ethers.Contract(token.address, hstABI, provider)
        const balanceEthersBig = await contract.balanceOf(userAddress)
        const balanceBig = ethersBigNumberToBig(
          balanceEthersBig,
          token.decimals
        )
        const balance = bigToBN(balanceBig, token.decimals)
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0
        const balanceNum = balanceBig.toNumber()
        const balanceUSD = priceUSD && balanceNum ? priceUSD * balanceNum : 0
        const balanceDisplayValue = balanceToDisplayValue(
          balance,
          token.decimals
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
          balanceUSD,
          balanceUsdDisplayValue,
          priceUSD,
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
  private async getErc721Balances(
    userAddress: string
  ): Promise<TokenWithBalanceERC721[]> {
    const user = new User({ baseUrl: 'https://blizzard.avax.network' })
    const result = await user.getNftState(userAddress)
    return (result.data ?? []) as any[] // TODO fit to TokenWithBalance interface
  }

  async getBalances(
    network: Network,
    provider: Provider,
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    const selectedCurrency = await (
      await firstValueFrom(currentSelectedCurrency$)
    ).toLowerCase()
    const activeTokenList = network.tokens ?? []

    const tokenAddresses = activeTokenList.map(token => token.address)

    const assetPlatformId =
      network.pricingProviders?.coingecko?.assetPlatformId ?? ''

    const tokenPriceDict =
      (await TokenService.getPricesWithMarketDataByAddresses(
        tokenAddresses,
        assetPlatformId,
        selectedCurrency
      )) ?? {}

    const nativeToken = await this.getNativeTokenBalance(
      provider,
      userAddress,
      network,
      selectedCurrency
    )

    const erc20Tokens = await this.getErc20Balances(
      provider,
      activeTokenList,
      tokenPriceDict,
      userAddress,
      network,
      selectedCurrency
    )

    const nftStates = await this.getErc721Balances(userAddress)

    return [nativeToken, ...erc20Tokens, ...nftStates]
  }
}

export default new EvmBalanceService()
