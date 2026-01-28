import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useGasCost } from './useGasCost'

type UseMaxDepositAmountParams = {
  token:
    | (LocalTokenWithBalance & { type: TokenType.NATIVE | TokenType.ERC20 })
    | undefined
  gasAmount: number
}

export const useMaxDepositAmount = ({
  token,
  gasAmount
}: UseMaxDepositAmountParams): {
  maxAmount: TokenUnit | undefined
} => {
  const { gasCost } = useGasCost({ gasAmount })

  const maxAmount = useMemo(() => {
    if (!token) return undefined
    if (token.type === TokenType.ERC20) {
      return new TokenUnit(token.balance, token.decimals, token.symbol)
    }

    if (!gasCost) return undefined

    return new TokenUnit(token.balance - gasCost, token.decimals, token.symbol)
  }, [token, gasCost])

  return { maxAmount }
}
