import { V1 as GlacierSdkV1 } from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import { GetActivitiesForAddressParams } from './types'
import { convertTransaction } from './utils/evmTransactionConverter'

const glacierUrl = __DEV__ ? Config.GLACIER_DEV_URL : Config.GLACIER_PROD_URL

const glacierSdk = new GlacierSdkV1({
  baseUrl: glacierUrl
})

export class EvmActivityService {
  async getActivities({
    network,
    address,
    nextPageToken,
    pageSize,
    criticalConfig
  }: GetActivitiesForAddressParams) {
    const response = await glacierSdk.listTransactions(
      network.chainId.toString(),
      address,
      { pageToken: nextPageToken, pageSize }
    )

    const ethereumWrappedAssets = criticalConfig?.critical.assets
    const bitcoinAssets = criticalConfig?.criticalBitcoin?.bitcoinAssets

    const transactions = response.data.transactions.map(item =>
      convertTransaction({
        item,
        network,
        address,
        ethereumWrappedAssets,
        bitcoinAssets
      })
    )

    return {
      transactions,
      nextPageToken: response.data.nextPageToken
    }
  }
}

export default new EvmActivityService()
