import { NetworkVMType } from '@avalabs/vm-module-types'
import Config from 'react-native-config'
import { NetworkAddresses } from 'services/wallet/types'
import fetchWithAppCheck from 'utils/httpClient'
import Logger from 'utils/Logger'

if (!Config.CORE_PROFILE_URL) {
  Logger.warn(
    'CORE_PROFILE_URL is missing. Profile service may not work properly.'
  )
}

class ProfileService {
  public async fetchXPAddresses({
    xpubXP,
    networkType,
    isTestnet = false,
    onlyWithActivity
  }: {
    xpubXP: string
    networkType: NetworkVMType.AVM | NetworkVMType.PVM
    isTestnet: boolean
    onlyWithActivity: boolean
  }): Promise<NetworkAddresses> {
    try {
      const res = await fetchWithAppCheck(
        `${Config.CORE_PROFILE_URL}/v1/get-addresses`,
        JSON.stringify({
          networkType: networkType,
          extendedPublicKey: xpubXP,
          isTestnet,
          onlyWithActivity
        })
      )

      if (!res.ok) {
        throw new Error(`${res.status}:${res.statusText}`)
      }

      return res.json()
    } catch (err) {
      Logger.error(`[ProfileService][fetchXPAddresses]${err}`)
      throw err
    }
  }
}

export default new ProfileService()
