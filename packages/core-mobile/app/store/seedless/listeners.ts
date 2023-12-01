import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked } from 'store/app'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

const refreshSeedlessToken = async (): Promise<void> => {
  const result = await SeedlessService.refreshToken()
  if (!result.success) {
    Logger.error(result.error.message)
    //TODO: initiate oidc login
  }
}

export const addSeedlessListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: refreshSeedlessToken
  })
}
