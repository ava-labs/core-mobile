import { ethers } from 'ethers'
import { User } from '@avalabs/blizzard-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { InfuraProvider } from '@ethersproject/providers'
import {
  activeTokenList$,
  currentSelectedCurrency$
} from '@avalabs/wallet-react-components'
import {
  balanceToDisplayValue,
  bigToBN,
  ethersBigNumberToBig
} from '@avalabs/utils-sdk'
import { firstValueFrom } from 'rxjs'
import { Network } from 'store/network'
import { TokenWithBalance } from 'store/balance'
import { TokenListDict } from './types'
import TokenService from './TokenService'

const delay = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time))

const hstABI = require('human-standard-token-abi')

type Provider = JsonRpcBatchInternal | InfuraProvider
activeTokenList$.subscribe(x => console.log('activeTokenList$', x))
export class EvmBalanceService {
  private async getNativeTokenBalance(
    provider: Provider,
    userAddress: string,
    network: Network
  ): Promise<TokenWithBalance> {
    const balanceEthersBig = await provider.getBalance(userAddress)
    const tokenPrice = await TokenService.getPriceByCoinId(
      network.nativeToken.coinId,
      network.platformId
    )
    const balanceBig = ethersBigNumberToBig(
      balanceEthersBig,
      network.nativeToken.denomination
    )
    const balance = bigToBN(balanceBig, network.nativeToken.denomination)
    const balanceDisplayValue = balanceToDisplayValue(
      balance,
      network.nativeToken.denomination
    )
    const balanceUsdDisplayValue = tokenPrice
      ? balanceBig.mul(tokenPrice).toFixed(2)
      : undefined

    return {
      ...network.nativeToken,
      balance,
      balanceDisplayValue,
      balanceUsdDisplayValue,
      priceUSD: tokenPrice
    }
  }

  private async getErc20Balances(
    provider: Provider,
    activeTokenList: TokenListDict,
    tokenPriceDict: {
      [address: string]: number
    },
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    return Promise.allSettled(
      Object.values(activeTokenList).map(async token => {
        const contract = new ethers.Contract(token.address, hstABI, provider)
        const balanceEthersBig = await contract.balanceOf(userAddress)
        const balanceBig = ethersBigNumberToBig(
          balanceEthersBig,
          token.decimals
        )
        const balance = bigToBN(balanceBig, token.decimals)
        const priceUSD = tokenPriceDict[token.address]
        const balanceNum = balanceBig.toNumber()
        const balanceUSD = priceUSD && balanceNum ? priceUSD * balanceNum : 0
        const balanceDisplayValue = balanceToDisplayValue(
          balance,
          token.decimals
        )
        const balanceUsdDisplayValue = priceUSD
          ? isNaN(balanceUSD)
            ? ''
            : balanceUSD.toFixed(2)
          : '0'

        return {
          ...token,
          balance,
          balanceDisplayValue,
          balanceUSD,
          balanceUsdDisplayValue
        }
      })
    ).then(res => {
      return res.reduce((acc: TokenWithBalance[], result) => {
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
    // TODO use chains sdk to get token list for the specified network
    // have to wait a bit for activeTokenList$ to update
    await delay(2000)
    const activeTokenList = await firstValueFrom(activeTokenList$)
    console.log('getBalances', activeTokenList)
    const tokenPriceDict = await TokenService.getTokenPricesByAddresses(
      Object.values(activeTokenList),
      network.platformId,
      network.nativeToken.coinId,
      selectedCurrency
    )

    const nativeToken = await this.getNativeTokenBalance(
      provider,
      userAddress,
      network
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
