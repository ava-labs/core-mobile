import {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20,
  PTokenWithBalance,
  XTokenWithBalance
} from 'store/balance/types'
import { NetworkContractToken } from '@avalabs/chains-sdk'
import { PChainBalance, XChainBalances } from '@avalabs/glacier-sdk'
import { Avax } from 'types'

export function getLocalTokenId(
  token:
    | NetworkTokenWithBalance
    | TokenWithBalanceERC20
    | NetworkContractToken
    | PTokenWithBalance
    | XTokenWithBalance
): string {
  return 'address' in token ? token.address : `${token.name}${token.symbol}`
}

export function calculateTotalBalance(
  uxtos: PChainBalance | XChainBalances
): Avax {
  return Object.values(uxtos).reduce(function (totalAcc, utxoList) {
    const typeSum = utxoList.reduce(function (typeAcc, utxo) {
      const balanceToAdd = Avax.fromNanoAvax(utxo.amount)
      return balanceToAdd.add(typeAcc)
    }, new Avax(0))

    return typeSum.add(totalAcc)
  }, new Avax(0))
}
