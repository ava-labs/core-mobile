import { onInAppRequestFailed, onInAppRequestSucceeded } from '../slice'
import { AgnosticRpcProvider, RpcProvider } from '../types'

class CoreMobileProvider implements AgnosticRpcProvider {
  provider = RpcProvider.CORE_MOBILE

  onError: AgnosticRpcProvider['onError'] = async ({
    request,
    error,
    listenerApi
  }) => {
    const requestId = request.data.id
    listenerApi.dispatch(onInAppRequestFailed({ requestId, error }))
  }

  onSuccess: AgnosticRpcProvider['onSuccess'] = async ({
    request,
    result,
    listenerApi
  }) => {
    const requestId = request.data.id
    listenerApi.dispatch(
      onInAppRequestSucceeded({ requestId, txHash: result as string })
    )
  }
  validateRequest: AgnosticRpcProvider['validateRequest'] = (): void => {
    // do nothing
  }
}

export const coreMobileProvider = new CoreMobileProvider()
