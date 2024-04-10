import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import NetworkService from 'services/network/NetworkService'
import { Networks } from 'store/network'

export const getNetworks = async (): Promise<Networks | undefined> => {
  return await queryClient
    .fetchQuery({
      queryKey: [ReactQueryKeys.NETWORKS],
      queryFn: () => {
        console.log('getNetworks: fetchQuery')
        return NetworkService.getNetworks()
      }
    })
    .catch(undefined)
}
