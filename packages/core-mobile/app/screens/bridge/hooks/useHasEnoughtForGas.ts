import Big from 'big.js'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { TokenType, selectTokensWithBalance } from 'store/balance'
import { selectActiveNetwork } from 'store/network'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'

export const useHasEnoughForGas = (): boolean => {
  const tokens = useSelector(selectTokensWithBalance)
  const activeNetwork = useSelector(selectActiveNetwork)
  const { data: networkFee } = useNetworkFee()

  const [hasEnough, setHasEnough] = useState(true)

  useEffect(() => {
    if (!tokens || !networkFee || isBitcoinNetwork(activeNetwork)) return

    const token = tokens.find(x => x.type === TokenType.NATIVE)
    // get gasPrice of network
    const balance = token && token.balance
    const estimatedGasCost = networkFee.low
    // compare balance and gasPrice
    if (balance && estimatedGasCost) {
      setHasEnough(new Big(balance.toString()).gte(estimatedGasCost.toString()))
    }
  }, [tokens, networkFee, activeNetwork])

  return hasEnough
}
