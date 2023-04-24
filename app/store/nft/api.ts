import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import Logger from 'utils/Logger'
import nftService from 'services/nft/NftService'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { GetNftArgs, NftResponse } from './types'

export const nftsApi = createApi({
  reducerPath: 'nftApi',
  baseQuery: fakeBaseQuery(),
  endpoints: builder => ({
    getNfts: builder.query<NftResponse, GetNftArgs>({
      queryFn: async ({ network, account, nextPageToken, currency }) => {
        if (!account) return { error: 'unable to get NFTs' }

        const t = SentryWrapper.startTransaction('get-nfts')
        try {
          const nftPagedData = await nftService.fetchNft(
            network.chainId,
            '0xdb5485c85bd95f38f9def0ca85499ef67dc581c0',
            currency,
            nextPageToken
          )

          const responseData: NftResponse = {
            nfts: nftPagedData.nfts,
            nextPageToken: nftPagedData.nextPageToken
          }

          return {
            data: responseData
          }
        } catch (err) {
          Logger.error(`failed to get nfts for chain ${network.chainId}`, err)
          return { data: { nfts: [] } }
        } finally {
          SentryWrapper.finish(t)
        }
      }
    })
  })
})

export const { useGetNftsQuery } = nftsApi
