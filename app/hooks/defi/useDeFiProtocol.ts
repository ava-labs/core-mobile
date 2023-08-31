import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import DeFiService from 'services/defi/DeFiService'
import { DeFiProtocol } from 'services/defi/types'
import { selectActiveAccount } from 'store/account'
import { convertSnakeToCamel } from 'utils/convertSnakeToCamel'

export const useDeFiProtocol = (protocolId: string) => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''

  return useQuery({
    queryKey: ['deFiProtocol', addressC, protocolId],
    queryFn: () => DeFiService.getDeFiProtocol(addressC, protocolId),
    select: data => convertSnakeToCamel(data) as DeFiProtocol
  })
}
