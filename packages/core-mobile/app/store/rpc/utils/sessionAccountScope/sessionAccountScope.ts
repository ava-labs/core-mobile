import { SessionTypes } from '@walletconnect/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import {
  CoreAccountAddresses,
  isVerifiedCoreDomain
} from 'store/rpc/handlers/wc_sessionRequest/utils'
import { isAccountApproved } from 'store/rpc/utils/isAccountApproved/isAccountApproved'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'

// Which accounts a read-only account method may disclose. In-app requests, the
// in-app browser (first-party origins only, gated in the router) and
// Verify-attested Core apps see the whole wallet; any other WalletConnect peer
// sees only its session's approved accounts, since the Core extension's
// identity is self-reported and spoofable.
export type AccountScope =
  | { kind: 'wallet' }
  | { kind: 'session'; namespaces: SessionTypes.Namespaces }
  | { kind: 'denied' }

export const getAccountScope = (
  request: RpcRequest<RpcMethod>
): AccountScope => {
  if (request.provider !== RpcProvider.WALLET_CONNECT) return { kind: 'wallet' }
  if (isVerifiedCoreDomain(request.data.verifyContext))
    return { kind: 'wallet' }

  const session = WalletConnectService.getSession(request.data.topic)
  if (!session) return { kind: 'denied' }
  return { kind: 'session', namespaces: session.namespaces }
}

export const isAccountInSession = (
  account: CoreAccountAddresses,
  namespaces: SessionTypes.Namespaces
): boolean =>
  Object.values(namespaces).some(namespace =>
    namespace.accounts.some(caip10 => {
      const [ns, reference] = caip10.split(':')
      return (
        ns !== undefined &&
        reference !== undefined &&
        isAccountApproved(account, `${ns}:${reference}`, namespaces)
      )
    })
  )
