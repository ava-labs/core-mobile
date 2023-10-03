import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { useSelector } from 'react-redux'
import { apiClient } from 'services/defi/apiClient'
import { refetchIntervals } from 'services/defi/constants'
import { DeFiSimpleProtocolCamelCase } from 'services/defi/types'
import { selectActiveAccount } from 'store/account'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeFiProtocolList = () => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''

  return useRefreshableQuery({
    refetchInterval: refetchIntervals.deFiProtocolList,
    enabled: !!addressC,
    queryKey: [ReactQueryKeys.DEFI_PROTOCOL_LIST, addressC],
    queryFn: () => apiClient.getDeFiProtocolList({ query: { id: addressC } }),
    select: data => {
      return DeFiSimpleProtocolCamelCase.array().parse(data.body)
    }
  })
}
