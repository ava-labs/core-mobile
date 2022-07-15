import { ListTransactionDetailsDto } from '@avalabs/glacier-sdk'
import { GetActivitiesParams } from './types'

export class BtcActivityService {
  async getActivities({
    network,
    address,
    nextPageToken,
    pageSize
  }: GetActivitiesParams) {
    return {} as ListTransactionDetailsDto
  }
}

export default new BtcActivityService()
