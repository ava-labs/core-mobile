import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { refetchIntervals } from 'services/defi/constants'
import InAppBrowserService from 'services/inAppBrowser/InAppBrowserService'
import { DeFiProtocolInformationCamelCase } from 'services/inAppBrowser/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeFiProtocolInformationList = () => {
  return useRefreshableQuery({
    refetchInterval: refetchIntervals.defi,
    queryKey: [ReactQueryKeys.DEFI_PROTOCOL_INFORMATION_LIST],
    queryFn: () => InAppBrowserService.getDeFiProtocolInformationList(),
    select: data => DeFiProtocolInformationCamelCase.array().parse(data)
  })
}
