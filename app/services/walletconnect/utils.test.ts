import { BITCOIN_NETWORK, NetworkVMType } from '@avalabs/chains-sdk'
import { isRequestSupportedOnNetwork } from './utils'

describe('app/services/walletconnect/utils.ts', () => {
  describe('isRequestSupportedOnNetwork', () => {
    it('returns false for eth_ calls on BITCOIN networks', () => {
      expect(
        isRequestSupportedOnNetwork(
          { id: 1, jsonrpc: '2.0', method: 'eth_chainId', params: [] },
          BITCOIN_NETWORK
        )
      ).toBe(false)
    })

    it('returns true for wallet_ calls on BITCOIN networks', () => {
      expect(
        isRequestSupportedOnNetwork(
          {
            id: 1,
            jsonrpc: '2.0',
            method: 'wallet_switchEthereumChain',
            params: []
          },
          BITCOIN_NETWORK
        )
      ).toBe(true)
    })

    it('returns true for eth_ calls on EVM networks', () => {
      expect(
        isRequestSupportedOnNetwork(
          {
            id: 1,
            jsonrpc: '2.0',
            method: 'wallet_switchEthereumChain',
            params: []
          },
          {
            ...BITCOIN_NETWORK,
            vmName: NetworkVMType.EVM
          }
        )
      ).toBe(true)
    })
  })
})
