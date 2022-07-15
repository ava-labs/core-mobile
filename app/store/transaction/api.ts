import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  ListTransactionDetailsDto,
  TransactionDetailsDto
} from '@avalabs/glacier-sdk'
import ActivityService from 'services/activity/ActivityService'
import Logger from 'utils/Logger'
import { GetAllTransactionsArgs, GetTransactionsArgs } from './types'

export const transactionApi = createApi({
  reducerPath: 'transactionApi',
  baseQuery: fakeBaseQuery(),
  endpoints: builder => ({
    getTransactions: builder.query<
      ListTransactionDetailsDto,
      GetTransactionsArgs
    >({
      queryFn: async ({ network, account, nextPageToken }) => {
        if (!account) return { error: 'unable to get transactions' }

        try {
          const transactions = await ActivityService.getActivities({
            network,
            address: account.address,
            nextPageToken
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
    getAllTransactions: builder.query<
      TransactionDetailsDto[],
      GetAllTransactionsArgs
    >({
      queryFn: async ({ network, account }) => {
        if (!account) return { error: 'unable to get transactions' }

        let nextPageToken
        let data: ListTransactionDetailsDto
        const result: TransactionDetailsDto[] = []

        try {
          do {
            data = await ActivityService.getActivities({
              network,
              address: account.address,
              nextPageToken,
              pageSize: 100
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
