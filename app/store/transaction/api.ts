import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import ActivityService from 'services/activity/ActivityService'
import Logger from 'utils/Logger'
import { ActivityResponse } from 'services/activity/types'
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
      queryFn: async ({ network, account, nextPageToken, criticalConfig }) => {
        if (!account) return { error: 'unable to get transactions' }

        try {
          const transactions = await ActivityService.getActivities({
            network,
            account,
            nextPageToken,
            criticalConfig
          })

          return { data: transactions }
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
      queryFn: async ({ network, account, criticalConfig }) => {
        if (!account) return { error: 'unable to get transactions' }

        try {
          const data = await ActivityService.getActivities({
            network,
            account,
            nextPageToken: undefined,
            pageSize: 100,
            criticalConfig
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
