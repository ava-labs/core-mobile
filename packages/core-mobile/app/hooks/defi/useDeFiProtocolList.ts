import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { useSelector } from 'react-redux'
import DeFiService from 'services/defi/DeFiService'
import { refetchIntervals } from 'services/defi/constants'
import { DeFiSimpleProtocolCamelCase } from 'services/defi/types'
import { selectActiveAccount } from 'store/account'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeFiProtocolList = () => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''

  return useRefreshableQuery({
    refetchInterval: refetchIntervals.defi,
    enabled: !!addressC,
    queryKey: [ReactQueryKeys.DEFI_PROTOCOL_LIST, addressC],
    queryFn: () => DeFiService.getDeFiProtocolList(addressC),
    select: data => DeFiSimpleProtocolCamelCase.array().parse(data)
  })
}
