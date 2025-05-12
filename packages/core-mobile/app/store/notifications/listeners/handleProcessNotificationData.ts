import { AppListenerEffectAPI } from 'store/types'
import { NotificationData } from 'contexts/DeeplinkContext/types'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { selectNetwork, setActive } from 'store/network'
import { selectAccountByAddress, setActiveAccountIndex } from 'store/account'

export const handleProcessNotificationData = async (
  listenerApi: AppListenerEffectAPI,
  data: NotificationData
): Promise<void> => {
  const state = listenerApi.getState()
  const dispatch = listenerApi.dispatch
  const isDeveloperMode = selectIsDeveloperMode(state)

  //maybe set network
  if ('chainId' in data && ['string', 'number'].includes(typeof data.chainId)) {
    const chainId = Number(data.chainId)
    const network = selectNetwork(chainId)(state)
    //check if testnet should be toggled to match chainId provided in data
    if (network && network.isTestnet !== isDeveloperMode) {
      dispatch(toggleDeveloperMode())
    }
    dispatch(setActive(chainId))
  }

  //maybe set account
  if ('accountAddress' in data && typeof data.accountAddress === 'string') {
    const account = selectAccountByAddress(data.accountAddress)(state)
    if (account) {
      dispatch(setActiveAccountIndex(account.index))
    }
  }
  if ('accountIndex' in data && typeof data.accountIndex === 'number') {
    dispatch(setActiveAccountIndex(data.accountIndex))
  }
}
