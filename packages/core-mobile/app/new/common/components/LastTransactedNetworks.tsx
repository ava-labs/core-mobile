import { useLastTransactedNetworks } from 'common/hooks/useLastTransactedNetworks'

/**
 * This component is used to trigger the useLastTransactedNetworks hook.
 * the result of the hook is saved in the MMKV storage, so we can fetch
 * the networks as soon as the app is opened.
 * It does not render anything.
 * @returns {React.JSX.Element} An empty fragment.
 */
export const LastTransactedNetworks = (): null => {
  useLastTransactedNetworks()
  return null
}
