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
    queryKey: ['deFiProtocolList', addressC],
    queryFn: () =>
      DeFiService.getDeFiProtocolList(
        '0x9026a229b535ecf0162dfe48fdeb3c75f7b2a7ae'
      ),
    select: data => convertSnakeToCamel(data) as DeFiSimpleProtocol[]
  })
}
