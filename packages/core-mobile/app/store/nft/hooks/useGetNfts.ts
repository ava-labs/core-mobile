import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { useInfiniteScroll } from 'store/utils/useInfiniteScroll'
import { GetNftArgs, NFTItemData, NftResponse } from '../types'
import { useGetNftsQuery } from '../api'

export type GetNfts = {
  nfts: NFTItemData[]
  isLoading: boolean
  isRefreshing: boolean
  isFirstPage: boolean
  refresh: () => void
  isFetchingNext: boolean
  fetchNext: () => void
  isError: boolean
  isSuccess: boolean
}
// a hook to get NFTs with pagination support for the current active network & account & currency
export const useGetNfts = (): GetNfts => {
  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)

  const {
    data,
    fetchNext,
    refresh,
    isLoading,
    isRefreshing,
    isFirstPage,
    isError,
    isSuccess,
    isFetchingNext
  } = useInfiniteScroll<GetNftArgs, NftResponse, NFTItemData>({
    useQuery: useGetNftsQuery,
    queryParams: { network, account },
    dataKey: 'nfts'
  })

  return {
    nfts: data,
    isLoading,
    isRefreshing,
    isFirstPage,
    refresh,
    isFetchingNext,
    fetchNext,
    isError,
    isSuccess
  }
}
