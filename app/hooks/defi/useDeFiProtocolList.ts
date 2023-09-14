import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { useSelector } from 'react-redux'
import DeFiService from 'services/defi/DeFiService'
import { refetchIntervals } from 'services/defi/constants'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { selectActiveAccount } from 'store/account'
import { convertSnakeToCamel } from 'utils/convertSnakeToCamel'

export const useDeFiProtocolList = () => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''

  return useRefreshableQuery({
    refetchInterval: refetchIntervals.deFiProtocolList,
    enabled: !!addressC,
    queryKey: [ReactQueryKeys.DEFI_PROTOCOL_LIST, addressC],
    queryFn: () => DeFiService.getDeFiProtocolList(addressC),
    select: data => convertSnakeToCamel(data) as DeFiSimpleProtocol[]
  })
}
