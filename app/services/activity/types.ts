import { Network } from '@avalabs/chains-sdk'

export type GetActivitiesParams = {
  network: Network
  address: string
  nextPageToken?: string
  pageSize?: number
}
