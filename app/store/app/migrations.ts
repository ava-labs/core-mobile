import { reloadAccounts } from 'store/settings/advanced'
import { AppListenerEffectAPI } from 'store/index'

/**
 * In CP-4778 Account type is extended with
 * addressAVM
 * addressPVM
 * addressCoreEth
 * so these must be populated when user installs that version for first time.
 *
 * @param listenerApi
 */
export function extendAccountProps(listenerApi: AppListenerEffectAPI) {
  const { getState, dispatch } = listenerApi
  const { accounts } = getState().account
  if (!accounts[0]?.addressAVM) {
    dispatch(reloadAccounts)
  }
}
