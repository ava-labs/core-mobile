import { useCallback } from 'react'
import {
  selectTokensWithBalanceByNetwork,
  TokenType,
  TokenWithBalanceERC20
} from 'store/balance'
import BN from 'bn.js'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { ethers } from 'ethers'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import TokenService from 'services/token/TokenService'

const UNKNOWN_TOKEN = (address: string): TokenWithBalanceERC20 => ({
  address,
  type: TokenType.ERC20,
  contractType: 'ERC-20',
  name: 'UNKNOWN TOKEN',
  symbol: '-',
  balance: new BN(0),
  decimals: 0,
  priceInCurrency: 0,
  marketCap: 0,
  change24: 0,
  vol24: 0,
  balanceCurrencyDisplayValue: '0',
  balanceDisplayValue: '0',
  balanceInCurrency: 0
})

export type FindToken = (address: string) => Promise<TokenWithBalanceERC20>

export function useFindToken(network: Network | undefined): FindToken {
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector(selectTokensWithBalanceByNetwork(network))

  const findToken: FindToken = useCallback(
    async (address: string) => {
      if (!activeAccount || !network) {
        return UNKNOWN_TOKEN(address)
      }

      const token = tokens.find(
        t =>
          t.type === TokenType.ERC20 &&
          t.address.toLowerCase() === address.toLowerCase()
      )

      if (token && token.type === TokenType.ERC20) {
        return token
      }

      // the token is unknown, fetch basic data
      let tokenData: NetworkContractToken | undefined
      try {
        tokenData = await TokenService.getTokenData(address, network)
      } catch (e) {
        return UNKNOWN_TOKEN(address)
      }

      const provider = networkService.getProviderForNetwork(network)
      if (!tokenData || !(provider instanceof JsonRpcBatchInternal)) {
        return UNKNOWN_TOKEN(address)
      }

      const contract = new ethers.Contract(address, ERC20.abi, provider)
      const balance = await contract.balanceOf?.(activeAccount.address)

      return {
        id: `${network?.chainId} - ${tokenData.address}`,
        ...tokenData,
        balance: balance,
        type: TokenType.ERC20,
        contractType: 'ERC-20',
        description: '',
        priceInCurrency: 0,
        marketCap: 0,
        change24: 0,
        vol24: 0,
        balanceCurrencyDisplayValue: '0',
        balanceDisplayValue: '0',
        balanceInCurrency: 0
      }
    },
    [activeAccount, network, tokens]
  )

  return findToken
}
