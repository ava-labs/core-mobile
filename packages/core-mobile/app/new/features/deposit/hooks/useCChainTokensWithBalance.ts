import { useQuery } from '@tanstack/react-query'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { selectActiveAccount } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'

export const useCChainTokensWithBalance = (): {
  tokens: LocalTokenWithBalance[]
  isRefetching: boolean
  isPending: boolean
  isLoading: boolean
  refetch: () => void
} => {
  const cChainNetwork = useCChainNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const currency = useSelector(selectSelectedCurrency)

  const { data, isRefetching, refetch, isPending, isLoading } = useQuery({
    queryKey: [
      'useCChainTokensWithBalance',
      cChainNetwork,
      activeAccount,
      currency
    ],
    queryFn: () => {
      if (!cChainNetwork || !activeAccount) {
        return Promise.reject('Invalid network or account')
      }

      return BalanceService.getBalancesForAccount({
        network: cChainNetwork,
        account: activeAccount,
        currency: currency.toLowerCase(),
        customTokens: []
      }).then(res => res.tokens)
    },
    enabled: Boolean(cChainNetwork) && Boolean(activeAccount)
  })

  return { tokens: data ?? [], isRefetching, refetch, isPending, isLoading }
}
