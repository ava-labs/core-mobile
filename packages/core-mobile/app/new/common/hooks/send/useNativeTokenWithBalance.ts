import { NetworkTokenWithBalance, TokenType } from '@avalabs/vm-module-types'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'

export const useNativeTokenWithBalance = (): NetworkTokenWithBalance => {
  const tokens = useSelector(selectTokensWithBalance)
  const [nativeToken, setNativeToken] = useState(
    tokens.find(t => t.type === TokenType.NATIVE) as NetworkTokenWithBalance
  )
  // in production, balance fetching occurs every two seconds, so update native token only when balance changes to avoid unnecessary re-renders
  useEffect(() => {
    const updatedNativeToken = tokens.find(
      t => t.type === TokenType.NATIVE
    ) as NetworkTokenWithBalance
    if (!nativeToken || updatedNativeToken?.balance !== nativeToken.balance) {
      setNativeToken(updatedNativeToken)
    }
  }, [tokens, nativeToken])

  return nativeToken
}
