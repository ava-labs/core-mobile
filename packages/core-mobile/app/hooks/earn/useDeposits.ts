import { PChainTransaction } from '@avalabs/glacier-sdk'
import { UseQueryResult } from '@tanstack/react-query'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

type UseDepositsReturnType = UseQueryResult<PChainTransaction[], unknown> & {
  pullToRefresh: () => void
  readonly isRefreshing: boolean
}

export const useDeposits = (): UseDepositsReturnType => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  // todo
  return useRefreshableQuery({
    queryKey: ['deposits', isDeveloperMode],
    queryFn: () => []
  })
}
