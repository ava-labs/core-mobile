import { QueryDefinition } from '@reduxjs/toolkit/dist/query'
import { UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks'
import { useCallback, useEffect, useMemo, useState } from 'react'

// a hook to implement infinite scroll with RTK Query
// it manages nextPageToken and the combined data from different pages
// inspired by https://github.com/reduxjs/redux-toolkit/discussions/1163#discussioncomment-1667214
export const useInfiniteScroll = <
  QueryArg extends { nextPageToken?: unknown },
  QueryResult extends { nextPageToken?: unknown },
  Item
>({
  useQuery,
  queryParams,
  dataKey
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useQuery: UseQuery<QueryDefinition<QueryArg, any, any, QueryResult>>
  queryParams?: QueryArg & { nextPageToken?: never }
  dataKey: keyof QueryResult
}) => {
  // when pageToken is undefined, it means first page
  // when pageToken is an empty string, it means no more pages to fetch
  const [pageToken, setPageToken] = useState<unknown | undefined>(undefined)
  const [combinedData, setCombinedData] = useState<Item[]>([])
  const queryParamsString = JSON.stringify(queryParams)
  const [shouldRefresh, setShouldRefresh] = useState(false)
  const refresh = useCallback(() => setShouldRefresh(true), [])

  const queryResponse = useQuery({
    nextPageToken: pageToken,
    ...queryParams
  } as QueryArg)
  const queryResponseData = queryResponse.data

  useEffect(() => {
    //initiate refresh every time queryParams change
    setShouldRefresh(true)
  }, [queryParamsString])

  useEffect(() => {
    //we need to re-fetch fist call to server, which is one with no pageToken
    //so here we reset pageToken if necessary and only then do re-fetch
    if (shouldRefresh && !pageToken) {
      setShouldRefresh(false)
      queryResponse.refetch()
    } else if (shouldRefresh) {
      setPageToken(undefined)
    }
  }, [pageToken, queryResponse, shouldRefresh])

  const [data, nextPageToken] = useMemo(() => {
    if (
      queryResponseData &&
      dataKey in queryResponseData &&
      'nextPageToken' in queryResponseData
    ) {
      const qData = queryResponseData[dataKey]
      const qNextToken = queryResponseData.nextPageToken

      return [qData, qNextToken]
    }

    return [[], undefined]
  }, [dataKey, queryResponseData])

  useEffect(() => {
    if (!Array.isArray(data)) {
      return
    }
    if (pageToken === undefined) {
      setCombinedData(data)
      return
    }
    // combine data and remove duplicates
    setCombinedData(previousData => {
      return [...new Set([...previousData, ...data])]
    })
  }, [data, pageToken])

  const fetchNext = (): void => {
    if (hasMore && !isFetching) {
      setPageToken(nextPageToken)
    }
  }

  const isLoading = queryResponse?.isLoading
  const isFetching = queryResponse?.isFetching
  const isSuccess = queryResponse?.isSuccess
  const isError = queryResponse?.isError
  const hasMore = !!nextPageToken
  const isFirstPage = pageToken === undefined
  const isFetchingNext = isFetching && pageToken !== undefined

  const isRefreshing =
    queryResponse &&
    !queryResponse.isLoading &&
    queryResponse.isFetching &&
    pageToken === undefined

  return {
    data: combinedData,
    fetchNext,
    refresh,
    isLoading,
    isFetching,
    isRefreshing,
    isFirstPage,
    isFetchingNext,
    isSuccess,
    isError,
    hasMore
  }
}
