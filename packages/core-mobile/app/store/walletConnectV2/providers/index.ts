import { AgnosticRpcProvider, RpcProvider } from '../types'
import { coreMobileProvider } from './coreMobile'
import { walletConnectProvider } from './walletConnect/walletConnect'

const providerMap = [coreMobileProvider, walletConnectProvider].reduce(
  (acc, current) => {
    acc.set(current.provider, current)

    return acc
  },
  new Map<RpcProvider, AgnosticRpcProvider>()
)

export default providerMap
