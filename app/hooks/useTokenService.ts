import { usePosthogContext } from 'contexts/PosthogContext'
import { proTokenService, tokenService } from 'services/token/TokenService'

export const useTokenService = () => {
  const { useCoinGeckoPro } = usePosthogContext()

  return useCoinGeckoPro ? proTokenService : tokenService
}
