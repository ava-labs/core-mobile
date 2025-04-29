import { useLastTransactedNetworks } from 'common/hooks/useLastTransactedNetworks'

// listAddressChains endpoint refreshes every 15 minutes,
// therefore we don't need to refresh the data too often
const REFETCH_INTERVAL = 1000 * 60 * 5 // 5 minutes

/**
 * This component is used to trigger the useLastTransactedNetworks hook.
 * the result of the hook is saved in the MMKV storage, so we can fetch
 * the networks as soon as the app is opened.
 * It does not render anything.
 * @returns {React.JSX.Element} An empty fragment.
 */
export const LastTransactedNetworks = (): null => {
  useLastTransactedNetworks({
    staleTime: REFETCH_INTERVAL,
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: true
  })
  return null
}
