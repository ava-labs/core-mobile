import { TokenType, TokenWithBalanceERC20 } from 'store/balance'
import BN from 'bn.js'
import { store } from 'store'
import { NetworkContractToken } from '@avalabs/chains-sdk'
import tokenService from 'services/token/TokenService'
import networkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { ethers } from 'ethers'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'

const UNKNOWN_TOKEN = (address: string): TokenWithBalanceERC20 => ({
  id: 'UNKNOWN TOKEN',
  address,
  type: TokenType.ERC20,
  contractType: 'ERC-20',
  name: 'UNKNOWN TOKEN',
  symbol: '-',
  balance: new BN(0),
  decimals: 0,
  description: '',
  priceInCurrency: 0,
  marketCap: 0,
  change24: 0,
  vol24: 0
})

export async function findToken(
  address: string
): Promise<TokenWithBalanceERC20> {
  const state = store.getState()
  const activeNetwork = state.network.networks[state.network.active]
  const activeAccount = state.account.accounts[state.account.activeAccountIndex]
  const balances =
    state.balance.balances[`${activeNetwork.chainId}-${activeAccount.address}`]
  if (!balances || !activeAccount || !activeNetwork) {
    return UNKNOWN_TOKEN(address)
  }

  const token = balances?.tokens?.find(
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
    tokenData = await tokenService.getTokenData(address, activeNetwork)
  } catch (e) {
    return UNKNOWN_TOKEN(address)
  }

  const provider = networkService.getProviderForNetwork(activeNetwork)
  if (!tokenData || !(provider instanceof JsonRpcBatchInternal)) {
    return UNKNOWN_TOKEN(address)
  }

  const contract = new ethers.Contract(address, ERC20.abi, provider)
  const balance = await contract.balanceOf(activeAccount.address)

  return {
    id: `${activeNetwork?.chainId} - ${tokenData.address}`,
    ...tokenData,
    balance: balance,
    type: TokenType.ERC20,
    contractType: 'ERC-20',
    description: '',
    priceInCurrency: 0,
    marketCap: 0,
    change24: 0,
    vol24: 0
  }
}
