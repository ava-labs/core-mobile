import { RpcMethod } from '@avalabs/vm-module-types'
import { isEvmSigningMethod, isAvalancheSigningMethod } from './approvalMethods'

describe('approvalMethods', () => {
  // Frozen snapshot: the exact EVM signing set before the refactor. If the enum
  // gains a new eth_*/personal_* member, the tripwire below fails and forces a
  // conscious update here too.
  const EVM_SIGNING = [
    'eth_sendTransaction',
    'eth_sendTransactionBatch',
    'eth_sign',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'personal_sign'
  ]
  const AVALANCHE_SIGNING = [
    'avalanche_sendTransaction',
    'avalanche_signTransaction',
    'avalanche_signMessage'
  ]
  const CROSS_NAMESPACE = [
    'solana_signTransaction',
    'solana_signAndSendTransaction',
    'solana_signMessage',
    'bitcoin_sendTransaction',
    'bitcoin_signTransaction',
    'hvm_signTransaction'
  ]
  const ACCOUNT_METHODS = [
    'avalanche_getAccounts',
    'avalanche_selectAccount',
    'avalanche_getAccountPubKey'
  ]

  it('isEvmSigningMethod matches exactly the EVM signing set', () => {
    const matched = Object.values(RpcMethod).filter(isEvmSigningMethod).sort()
    expect(matched).toEqual([...EVM_SIGNING].sort())
  })

  it('isAvalancheSigningMethod matches exactly the avalanche signing set', () => {
    const matched = Object.values(RpcMethod)
      .filter(isAvalancheSigningMethod)
      .sort()
    expect(matched).toEqual([...AVALANCHE_SIGNING].sort())
  })

  it('neither helper classifies a cross-namespace enum member', () => {
    for (const m of CROSS_NAMESPACE) {
      expect(isEvmSigningMethod(m)).toBe(false)
      expect(isAvalancheSigningMethod(m)).toBe(false)
    }
  })

  it('neither helper classifies the first-party account methods as signing', () => {
    for (const m of ACCOUNT_METHODS) {
      expect(isEvmSigningMethod(m)).toBe(false)
      expect(isAvalancheSigningMethod(m)).toBe(false)
    }
  })

  it('is prototype-safe (Object members are not signing methods)', () => {
    for (const m of [
      'toString',
      'constructor',
      '__proto__',
      'hasOwnProperty'
    ]) {
      expect(isEvmSigningMethod(m)).toBe(false)
      expect(isAvalancheSigningMethod(m)).toBe(false)
    }
  })

  it('enum-hygiene tripwire: every RpcMethod member is classified or in a known-unhandled namespace', () => {
    // Namespaces with no injected provider yet. If vm-module-types adds a member
    // outside these and outside eth_/personal_/avalanche_, this fails — forcing
    // a conscious decision (the list-free replacement for the old drift guard).
    const KNOWN_UNHANDLED = ['solana_', 'bitcoin_', 'hvm_']
    for (const m of Object.values(RpcMethod)) {
      const classified = isEvmSigningMethod(m) || isAvalancheSigningMethod(m)
      const knownUnhandled = KNOWN_UNHANDLED.some(p => m.startsWith(p))
      expect(classified || knownUnhandled).toBe(true)
    }
  })
})
