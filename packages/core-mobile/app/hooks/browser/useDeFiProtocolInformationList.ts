import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { refetchIntervals } from 'services/defi/constants'
import BrowserService from 'services/browser/BrowserService'
import { DeFiProtocolInformationCamelCase } from 'services/browser/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeFiProtocolInformationList = ({
  limit
}: {
  limit: number
}) => {
  return useRefreshableQuery({
    refetchInterval: refetchIntervals.defi,
    queryKey: [ReactQueryKeys.DEFI_PROTOCOL_INFORMATION_LIST],
    queryFn: () => BrowserService.getDeFiProtocolInformationList(),
    select: data => {
      const topTvl = data.sort((a, b) => b.tvl - a.tvl).slice(0, limit)
      return DeFiProtocolInformationCamelCase.array().parse(topTvl)
    }
  })
}
