import bs58 from 'bs58'
import { SessionTypes } from '@walletconnect/types'
import { RpcMethod } from '@avalabs/vm-module-types'

export const transformSolanaMessageParams = (
  params: unknown
): { account: string; serializedMessage: string }[] | undefined => {
  if (
    params &&
    typeof params === 'object' &&
    'message' in params &&
    'pubkey' in params &&
    'message' in (params as Record<string, unknown>)
  ) {
    // Transform from {pubkey, message} to [{account, serializedMessage}] format with base64 encoding
    return [
      {
        account: (params as { pubkey: string }).pubkey,
        serializedMessage: Buffer.from(
          bs58.decode((params as { message: string }).message)
        ).toString('base64')
      }
    ]
  }
  return undefined
}

export const getSolanaAccountFromParams = (
  params: unknown,
  requestSession: SessionTypes.Struct
): string => {
  if (
    params &&
    typeof params === 'object' &&
    'pubkey' in params &&
    (params as { pubkey: string }).pubkey
  ) {
    return (params as { pubkey: string }).pubkey
  }

  // Fall back to session extraction (Orca format)
  const solanaNamespace = requestSession.namespaces?.solana
  if (solanaNamespace && solanaNamespace.accounts.length > 0) {
    const accountParts = solanaNamespace.accounts[0]?.split(':')
    return accountParts?.[2] ?? ''
  }

  throw new Error('No Solana account found in params or session')
}

export const transformSolanaTransactionParams = (
  params: unknown,
  requestSession: SessionTypes.Struct
): { account: string; serializedTx: string }[] | undefined => {
  if (
    params &&
    typeof params === 'object' &&
    !Array.isArray(params) &&
    'transaction' in params
  ) {
    const solanaAccount = getSolanaAccountFromParams(params, requestSession)

    // Transform to the format expected by SVM module
    return [
      {
        account: solanaAccount,
        serializedTx: (params as { transaction: string }).transaction
      }
    ]
  }
  return undefined
}

export const transformSolanaParams = (
  request: { params: { request: { method: string; params: any } } },
  session: SessionTypes.Struct
): void => {
  const { method, params } = request.params.request

  // Solana dApps use different parameter formats than our internal VM module:
  // 1. Different dApps (Jupiter, Orca) structure their parameters differently
  // 2. Encoding differences: dApps use base58, our VM uses base64
  // 3. Parameter shape: dApps use {pubkey, message} format, VM expects [{account, serializedMessage}]

  switch (method) {
    // Handle Solana message signing
    case RpcMethod.SOLANA_SIGN_MESSAGE: {
      // Transform from dApp format: { pubkey: string, message: base58 }
      // to VM format: [{ account: string, serializedMessage: base64 }]
      const transformedParams = transformSolanaMessageParams(params)
      if (transformedParams) {
        request.params.request.params = transformedParams
      }
      break
    }

    // Handle Solana transaction signing
    case RpcMethod.SOLANA_SIGN_TRANSACTION: {
      // Transform from various dApp formats:
      // Jupiter: { pubkey: string, transaction: string }
      // Orca: { transaction: string } (account from session)
      // to VM format: [{ account: string, serializedTx: string }]
      const transformedParams = transformSolanaTransactionParams(
        params,
        session
      )
      if (transformedParams) {
        request.params.request.params = transformedParams
      }
      break
    }
  }
}
