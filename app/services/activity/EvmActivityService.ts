import { V1 as GlacierSdkV1 } from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import { GetActivitiesParams } from './types'

const glacierUrl = __DEV__ ? Config.GLACIER_DEV_URL : Config.GLACIER_PROD_URL

const glacierSdk = new GlacierSdkV1({
  baseUrl: glacierUrl
})

export class EvmActivityService {
  async getActivities({
    network,
    address,
    nextPageToken,
    pageSize
  }: GetActivitiesParams) {
    console.log('network.chainId', network.chainId)
    console.log('address', address)
    console.log('nextPageToken', nextPageToken)
    const response = await glacierSdk.listTransactions(
      network.chainId.toString(),
      address,
      { pageToken: nextPageToken, pageSize }
    )
    const activities = response.data

    return activities
  }
}

export default new EvmActivityService()
