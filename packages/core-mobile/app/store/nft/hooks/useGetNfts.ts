import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { useInfiniteScroll } from 'store/utils/useInfiniteScroll'
import { selectSelectedCurrency } from 'store/settings/currency'
import { GetNftArgs, NFTItemData, NftResponse } from '../types'
import { useGetNftsQuery } from '../api'

// a hook to get NFTs with pagination support for the current active network & account & currency
export const useGetNfts = () => {
  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)
  const currency = useSelector(selectSelectedCurrency)

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
    queryParams: { network, account, currency },
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
