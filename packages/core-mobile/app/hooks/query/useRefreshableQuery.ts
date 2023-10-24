import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

/**
 * This hook is same as useQuery. The only difference is
 * it supports pullToRefresh and isRefreshing.
 * These 2 props are needed to show refreshing state with list components.
 *
 * More details here:
 * - pull to refresh solution: https://github.com/TanStack/query/discussions/2842
 * - wrapper typing: https://twitter.com/TkDodo/status/1491451513264574501
 */
export const useRefreshableQuery = <
  TQueryKey extends (string | Record<string, unknown> | boolean)[],
  TQueryFnData,
  TError,
  TData = TQueryFnData
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & {
    initialData?: undefined
  }
) => {
  const isRefreshing = useRef(false)
  const query = useQuery(options)

  useEffect(() => {
    if (!query.isRefetching) isRefreshing.current = false
  }, [query.isRefetching])

  const pullToRefresh = () => {
    isRefreshing.current = true
    query.refetch()
  }

  return Object.assign({}, query, {
    pullToRefresh,
    get isRefreshing() {
      return query.isRefetching && isRefreshing.current
    }
  })
}
