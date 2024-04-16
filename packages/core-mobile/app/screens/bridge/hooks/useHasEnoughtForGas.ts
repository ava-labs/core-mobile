import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { TokenType, selectTokensWithBalance } from 'store/balance'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'

export const useHasEnoughForGas = (): boolean => {
  const { activeNetwork } = useNetworks()
  const tokens = useSelector(selectTokensWithBalance)
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
      setHasEnough(estimatedGasCost.maxFeePerGas.lt(balance))
    }
  }, [tokens, networkFee, activeNetwork])

  return hasEnough
}
