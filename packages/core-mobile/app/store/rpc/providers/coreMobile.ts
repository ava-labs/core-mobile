import { AgnosticRpcProvider, RpcProvider } from '../types'

class CoreMobileProvider implements AgnosticRpcProvider {
  provider = RpcProvider.CORE_MOBILE

  onError: AgnosticRpcProvider['onError'] = async () => {
    // do nothing
  }

  onSuccess: AgnosticRpcProvider['onSuccess'] = async () => {
    // do nothing
  }

  validateRequest: AgnosticRpcProvider['validateRequest'] = (): void => {
    // do nothing
  }
}

export const coreMobileProvider = new CoreMobileProvider()
