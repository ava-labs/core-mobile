import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import ActivityService from 'services/activity/ActivityService'
import { ActivityResponse } from 'services/activity/types'
import Logger from 'utils/Logger'
import {
  GetRecentTransactionsArgs,
  GetTransactionsArgs,
  Transaction
} from './types'

export const transactionApi = createApi({
  reducerPath: 'transactionApi',
  baseQuery: fakeBaseQuery(),
  endpoints: builder => ({
    getTransactions: builder.query<ActivityResponse, GetTransactionsArgs>({
      queryFn: async ({ network, account, nextPageToken }) => {
        if (!account || !network) return { error: 'unable to get transactions' }

        try {
          const data = await ActivityService.getActivities({
            network,
            account,
            nextPageToken
          })

          return { data }
        } catch (err) {
          Logger.error(
            `failed to get transactions for chain ${network.chainId}`,
            err
          )
          return { data: { transactions: [], nextPageToken: '' } }
        }
      }
    }),
    getRecentsTransactions: builder.query<
      Transaction[],
      GetRecentTransactionsArgs
    >({
      queryFn: async ({ network, account }) => {
        if (!account) return { error: 'unable to get transactions' }
        if (!network) return { error: 'unable to get network' }

        try {
          const data = await ActivityService.getActivities({
            network,
            account,
            nextPageToken: undefined,
            pageSize: 100
          })

          return { data: data.transactions }
        } catch (err) {
          Logger.error(
            `failed to get transactions for chain ${network.chainId}`,
            err
          )
          return { data: [] }
        }
      }
    })
  })
})

export const { useGetTransactionsQuery, useGetRecentsTransactionsQuery } =
  transactionApi
