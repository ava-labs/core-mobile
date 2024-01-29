import Big from 'big.js'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { TokenType, selectTokensWithBalance } from 'store/balance'

export const useHasEnoughForGas = (): boolean => {
  const tokens = useSelector(selectTokensWithBalance)
  const { data: networkFee } = useNetworkFee()

  const [hasEnough, setHasEnough] = useState(true)

  useMemo(() => {
    if (!tokens || !networkFee) return
    const token = tokens.find(x => x.type === TokenType.NATIVE)
    // get gasPrice of network
    const balance = token && token.balance
    const estimatedGasCost = networkFee.low
    // check if balance > gasPrice
    if (balance && estimatedGasCost) {
      setHasEnough(new Big(balance.toString()).gte(estimatedGasCost.toString()))
    }
  }, [tokens, networkFee])

  return hasEnough
}
