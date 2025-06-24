import { AppListenerEffectAPI } from 'store/types'
import { NotificationData } from 'contexts/DeeplinkContext/types'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { selectNetwork } from 'store/network'
import { selectAccountByAddress, setActiveAccount } from 'store/account'

export const handleProcessNotificationData = async (
  listenerApi: AppListenerEffectAPI,
  data: NotificationData
): Promise<void> => {
  const state = listenerApi.getState()
  const dispatch = listenerApi.dispatch

  const isDeveloperMode = selectIsDeveloperMode(state)

  //maybe toggle testnet mode
  if ('chainId' in data && ['string', 'number'].includes(typeof data.chainId)) {
    const chainId = Number(data.chainId)
    const network = selectNetwork(chainId)(state)
    //check if testnet should be toggled to match chainId provided in data
    if (network && network.isTestnet !== isDeveloperMode) {
      dispatch(toggleDeveloperMode())
    }
  }

  // prioritize new approach of using accountId over accountAddress
  if ('accountId' in data && typeof data.accountId === 'string') {
    dispatch(setActiveAccount(data.accountId))
  } else if (
    'accountAddress' in data &&
    typeof data.accountAddress === 'string'
  ) {
    const account = selectAccountByAddress(data.accountAddress)(state)
    if (account) {
      dispatch(setActiveAccount(account.id))
    }
  }
}
