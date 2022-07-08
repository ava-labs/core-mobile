import {
  bnToLocaleString,
  Erc20Token,
  getErc20Token,
  BN
} from '@avalabs/avalanche-wallet-sdk'
import {
  ERC20WithBalance,
  walletState$
} from '@avalabs/wallet-react-components'
import { firstValueFrom } from 'rxjs'

const UNKNOWN_TOKEN = (address: string): ERC20WithBalance => ({
  address,
  isErc20: true,
  name: 'UNKNOWN TOKEN',
  symbol: '-',
  balance: new BN(0),
  denomination: 0,
  decimals: 0,
  balanceParsed: '0'
})

export async function findToken(address: string): Promise<ERC20WithBalance> {
  const walletState = await firstValueFrom(walletState$)
  if (!walletState) {
    return UNKNOWN_TOKEN(address)
  }

  const token = walletState.erc20Tokens.find(
    t => t.address.toLowerCase() === address.toLowerCase()
  )

  if (token) {
    return token
  }

  // the token is unknown, fetch basic data
  let tokenData: Erc20Token
  try {
    tokenData = await getErc20Token(address)
  } catch (e) {
    return UNKNOWN_TOKEN(address)
  }

  if (!tokenData) {
    return UNKNOWN_TOKEN(address)
  }

  const balance = await tokenData.balanceOf(walletState.addresses.addrC)

  return {
    ...tokenData,
    denomination: tokenData.decimals,
    balance: balance,
    balanceParsed: bnToLocaleString(balance, tokenData.decimals),
    isErc20: true
  }
}
