import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import Logger from 'utils/Logger'
import nftService from 'services/nft/NftService'
import { GetNftArgs, NftResponse } from './types'

export const nftsApi = createApi({
  reducerPath: 'nftApi',
  baseQuery: fakeBaseQuery(),
  endpoints: builder => ({
    getNfts: builder.query<NftResponse, GetNftArgs>({
      queryFn: async ({ network, account, nextPageToken, currency }) => {
        if (!account) return { error: 'unable to get transactions' }

        try {
          const nftPagedData = await nftService.fetchNft(
            network.chainId,
            account.address,
            currency,
            nextPageToken
          )

          return {
            data: {
              nfts: nftPagedData.nftData,
              nextPageToken: nftPagedData.nextPageToken
            } as NftResponse
          }
        } catch (err) {
          Logger.error(`failed to get nfts for chain ${network.chainId}`, err)
          return { data: { nfts: [] } }
        }
      }
    })
  })
})

export const { useGetNftsQuery } = nftsApi
