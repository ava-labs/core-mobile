import { QueryDefinition } from '@reduxjs/toolkit/dist/query'
import { UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks'
import { useEffect, useMemo, useRef, useState } from 'react'

// a hook to implement infinite scroll with RTK Query
// it manages nextPageToken and the combined data from different pages
// inspired by https://github.com/reduxjs/redux-toolkit/discussions/1163#discussioncomment-1667214
export const useInfiniteScroll = <
  QueryArg extends { nextPageToken?: string },
  QueryResult extends { nextPageToken?: string },
  Item
>({
  useQuery,
  queryParams,
  dataKey
}: {
  useQuery: UseQuery<QueryDefinition<QueryArg, any, any, QueryResult>>
  queryParams?: QueryArg & { nextPageToken?: never }
  dataKey: keyof QueryResult
}) => {
  // when pageToken is undefined, it means first page
  // when pageToken is an empty string, it means no more pages to fetch
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)
  const [combinedData, setCombinedData] = useState<Item[]>([])
  const queryParamsString = JSON.stringify(queryParams)

  useEffect(() => {
    //reset combined data and pagetoken every time queryParams change
    setPageToken(undefined)
    setCombinedData([])
  }, [queryParamsString])

  const queryResponse = useQuery({
    nextPageToken: pageToken,
    ...(queryParams && queryParams)
  } as QueryArg)

  const queryResponseData = queryResponse.data

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
    if (Array.isArray(data) && data.length > 0) {
      if (pageToken === undefined) {
        setCombinedData(data)
      } else {
        // combine data and remove duplicates
        setCombinedData(previousData => {
          return [...new Set([...previousData, ...data])]
        })
      }
    }
  }, [data, nextPageToken, pageToken])

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const refresh = useRef(() => {})

  useEffect(() => {
    if (pageToken === undefined) {
      refresh.current = () => {
        setPageToken(undefined)
        setCombinedData([])
        // this refetch belongs to the very first query that has undefined pageToken
        // calling it means refetching from page 1
        queryResponse.refetch()
      }
    }
  }, [pageToken, queryResponse])

  const fetchNext = () => {
    if (hasMore && !isFetching) {
      setPageToken(nextPageToken)
    }
  }

  const isLoading = queryResponse?.isLoading
  const isFetching = queryResponse?.isFetching
  const isSuccess = queryResponse?.isSuccess
  const isError = queryResponse?.isError
  const hasMore = nextPageToken !== ''

  const isRefreshing = queryResponse
    ? !queryResponse.isLoading &&
      queryResponse.isFetching &&
      pageToken === undefined
    : false

  const isFetchingNext = isFetching && pageToken !== undefined

  return {
    data: combinedData,
    fetchNext,
    refresh: refresh.current,
    isLoading,
    isFetching,
    isRefreshing,
    isFetchingNext,
    isSuccess,
    isError,
    hasMore
  }
}
