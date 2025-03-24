import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useIsFocused } from '@react-navigation/native'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { refetchIntervals } from 'consts/earn'
import { TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import { getCChainBalance } from 'services/balance/getCChainBalance'
import useCChainNetwork from './useCChainNetwork'

export const useCChainBalance = (): UseQueryResult<
  TokenWithBalanceEVM | undefined,
  Error
> => {
  const network = useCChainNetwork()
  const cAddress = useSelector(selectActiveAccount)?.addressC
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const isFocused = useIsFocused()

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: isFocused && Boolean(cAddress),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['cChainBalance', isDeveloperMode, cAddress, selectedCurrency],
    queryFn: async () => {
      if (network === undefined || cAddress === undefined) {
        return Promise.reject('Invalid C-Chain network or address')
      }

      return getCChainBalance({
        cChainNetwork: network,
        cAddress,
        currency: selectedCurrency
      })
    }
  })
}
