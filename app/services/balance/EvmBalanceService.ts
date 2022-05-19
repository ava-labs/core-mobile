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
import { TokenWithBalance } from 'store/balance'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import TokenService from './TokenService'

const hstABI = require('human-standard-token-abi')

type Provider = JsonRpcBatchInternal | InfuraProvider

export class EvmBalanceService {
  private async getNativeTokenBalance(
    provider: Provider,
    userAddress: string,
    network: Network,
    selectedCurrency: string
  ): Promise<TokenWithBalance> {
    const balanceEthersBig = await provider.getBalance(userAddress)
    const priceUSD = await TokenService.getPriceByCoinId(
      network.networkToken.coingeckoId,
      selectedCurrency
    )
    const balanceBig = ethersBigNumberToBig(
      balanceEthersBig,
      network.networkToken.decimals
    )
    const balanceNum = balanceBig.toNumber()
    const balance = bigToBN(balanceBig, network.networkToken.decimals)
    const balanceDisplayValue = balanceToDisplayValue(
      balance,
      network.networkToken.decimals
    )
    const balanceUSD = priceUSD && balanceNum ? priceUSD * balanceNum : 0
    const balanceUsdDisplayValue = priceUSD
      ? balanceBig.mul(priceUSD).toFixed(2)
      : '0'

    return {
      ...network.networkToken,
      balance,
      balanceDisplayValue,
      balanceUSD,
      balanceUsdDisplayValue,
      priceUSD
    }
  }

  private async getErc20Balances(
    provider: Provider,
    activeTokenList: NetworkContractToken[],
    tokenPriceDict: {
      [address: string]: number
    },
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    return Promise.allSettled(
      activeTokenList.map(async token => {
        const contract = new ethers.Contract(token.address, hstABI, provider)
        const balanceEthersBig = await contract.balanceOf(userAddress)
        const balanceBig = ethersBigNumberToBig(
          balanceEthersBig,
          token.decimals
        )
        const balance = bigToBN(balanceBig, token.decimals)
        const priceUSD = tokenPriceDict[token.address.toLowerCase()]
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
          balance,
          balanceDisplayValue,
          balanceUSD,
          balanceUsdDisplayValue,
          priceUSD
        }
      })
    ).then(res => {
      return res.reduce<TokenWithBalance[]>((acc, result) => {
        return result.status === 'fulfilled' ? [...acc, result.value] : acc
      }, [])
    })
  }

  private async getErc721Balances(
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    const user = new User({ baseUrl: 'https://blizzard.avax.network' })
    const result = await user.getNftState(userAddress)
    return (result.data ?? []) as any[] // TODO fit to TokenWithBalance interface
  }

  async getBalances(
    network: Network,
    provider: Provider,
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    const selectedCurrency = await firstValueFrom(currentSelectedCurrency$)
    const activeTokenList = network.tokens ?? []

    const tokenPriceDict = await TokenService.getTokenPricesByAddresses(
      activeTokenList as { address: string }[],
      network.coingeckoAssetPlatformId,
      network.networkToken.coingeckoId,
      selectedCurrency
    )

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
      userAddress
    )

    const nftStates = await this.getErc721Balances(userAddress)

    return [nativeToken, ...erc20Tokens, ...nftStates]
  }
}

export default new EvmBalanceService()
