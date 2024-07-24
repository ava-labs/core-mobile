import { PTokenWithBalance, XTokenWithBalance } from 'store/balance/types'
import { AggregatedAssetAmount } from '@avalabs/glacier-sdk'
import { Avax } from 'types'
import type {
  NetworkContractToken,
  NetworkTokenWithBalance,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'

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
  uxtos: Record<string, AggregatedAssetAmount[]>
): Avax {
  return Object.values(uxtos).reduce(function (totalAcc, utxoList) {
    const typeSum = utxoList.reduce(function (typeAcc, utxo) {
      const balanceToAdd = Avax.fromNanoAvax(utxo.amount)
      return balanceToAdd.add(typeAcc)
    }, new Avax(0))
    return typeSum.add(totalAcc)
  }, new Avax(0))
}
