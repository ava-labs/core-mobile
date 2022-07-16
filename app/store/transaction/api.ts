import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import ActivityService from 'services/activity/ActivityService'
import Logger from 'utils/Logger'
import { ActivityResponse } from 'services/activity/types'
import {
  GetAllTransactionsArgs,
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
    getAllTransactions: builder.query<Transaction[], GetAllTransactionsArgs>({
      queryFn: async ({ network, account, criticalConfig }) => {
        if (!account) return { error: 'unable to get transactions' }

        let nextPageToken
        let data: ActivityResponse
        const result: Transaction[] = []

        try {
          do {
            data = await ActivityService.getActivities({
              network,
              account,
              nextPageToken,
              pageSize: 100,
              criticalConfig
            })

            result.push(...data.transactions)
            nextPageToken = data.nextPageToken
          } while (nextPageToken !== '' && nextPageToken !== undefined)

          return { data: result }
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

export const { useGetTransactionsQuery, useGetAllTransactionsQuery } =
  transactionApi
