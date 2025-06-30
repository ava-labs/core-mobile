import {
  SolanaProvider,
  transferSol,
  transferToken
} from '@avalabs/core-wallets-sdk'
import {
  TokenType,
  TokenWithBalanceSPL,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'

export const buildSolanaTransaction = async ({
  fromAddress,
  toAddress,
  amount,
  token,
  provider
}: {
  fromAddress: string
  toAddress: string
  amount?: bigint
  token: TokenWithBalanceSVM | TokenWithBalanceSPL
  provider: SolanaProvider
}): Promise<any> => {
  if (amount !== undefined) {
    if (token.type === TokenType.NATIVE) {
      return transferSol({
        from: fromAddress,
        to: toAddress,
        amount: amount,
        provider
      })
    }

    return transferToken({
      from: fromAddress,
      to: toAddress,
      mint: token.address,
      amount: amount,
      decimals: token.decimals,
      provider
    })
  }
}
