import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA } from 'seedless/types'

export const useUserMfa = (): UseQueryResult<MFA[], Error> => {
  return useQuery({
    queryKey: [ReactQueryKeys.USER_MFA],
    queryFn: () => SeedlessService.session.userMfa()
  })
}
