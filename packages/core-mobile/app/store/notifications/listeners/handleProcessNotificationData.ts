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
  } else if (
    'isDeveloperMode' in data &&
    typeof data.isDeveloperMode === 'string'
  ) {
    // Stake-complete local notifications carry no chainId — they stamp the
    // scheduling environment as an `isDeveloperMode` string instead (see
    // NotificationsService.scheduleNotification). Toggle the same way so a
    // testnet stake's notification actually lands on the stake that
    // triggered it; without this the account switched but the mode didn't,
    // and the stake surfaces (scoped to the current mode) couldn't show it.
    const targetIsDeveloperMode = data.isDeveloperMode === 'true'
    if (targetIsDeveloperMode !== isDeveloperMode) {
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
