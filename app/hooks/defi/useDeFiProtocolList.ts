import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import DeFiService from 'services/defi/DeFiService'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { selectActiveAccount } from 'store/account'
import { convertSnakeToCamel } from 'utils/convertSnakeToCamel'

export const useDeFiProtocolList = () => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''

  return useQuery({
    enabled: !!addressC,
    queryKey: ['deFiProtocolList', addressC],
    queryFn: () => DeFiService.getDeFiProtocolList(addressC),
    select: data => convertSnakeToCamel(data) as DeFiSimpleProtocol[]
  })
}
