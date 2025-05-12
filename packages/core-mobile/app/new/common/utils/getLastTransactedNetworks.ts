import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'

// Get the last transacted networks for a given address after dehydration.
export const getLastTransactedNetworks = (address: string): Networks => {
  const result: Networks | undefined = queryClient.getQueryData([
    ReactQueryKeys.LAST_TRANSACTED_ERC20_NETWORKS,
    address
  ])
  return result ?? {}
}
