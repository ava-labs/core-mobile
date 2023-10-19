import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import DeFiService from 'services/defi/DeFiService'
import { refetchIntervals } from 'services/defi/constants'
import { DeFiProtocolInformationCamelCase } from 'services/defi/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeFiProtocolInformationList = () => {
  return useRefreshableQuery({
    refetchInterval: refetchIntervals.defiProtocolInformationList,
    queryKey: [ReactQueryKeys.DEFI_PROTOCOL_INFORMATION_LIST],
    queryFn: () => DeFiService.getDeFiProtocolInformationList(),
    select: data => DeFiProtocolInformationCamelCase.array().parse(data)
  })
}
