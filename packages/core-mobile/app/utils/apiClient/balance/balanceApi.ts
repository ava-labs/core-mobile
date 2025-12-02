import Config from 'react-native-config'
import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'
import { fetch as expoFetch } from 'expo/fetch'
import { CORE_HEADERS } from '../constants'
import { GetBalancesRequestBody } from '../generated/balanceApi.client/types.gen'

// if (!Config.BALANCE_URL) Logger.warn('BALANCE_URL ENV is missing')

export const BALANCE_URL = 'https://core-balance-api.avax-test.network'

const balanceApi = {
  getBalances: async (body: GetBalancesRequestBody) => {
    const appCheckToken = await AppCheckService.getToken()

    return expoFetch(`${BALANCE_URL}/v1/balance/get-balances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': appCheckToken.token,
        ...CORE_HEADERS
      },
      body: JSON.stringify(body)
    })
  }
}
export { balanceApi }
