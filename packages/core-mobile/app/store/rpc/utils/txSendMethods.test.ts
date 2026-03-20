import { RpcMethod } from 'store/rpc/types'
import { isTxSendMethod, TX_SEND_METHODS } from './txSendMethods'

describe('txSendMethods', () => {
  describe('TX_SEND_METHODS', () => {
    it('includes exactly the four send methods', () => {
      expect(TX_SEND_METHODS).toContain(RpcMethod.ETH_SEND_TRANSACTION)
      expect(TX_SEND_METHODS).toContain(RpcMethod.AVALANCHE_SEND_TRANSACTION)
      expect(TX_SEND_METHODS).toContain(RpcMethod.BITCOIN_SEND_TRANSACTION)
      expect(TX_SEND_METHODS).toContain(
        RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION
      )
      expect(TX_SEND_METHODS).toHaveLength(4)
    })
  })

  describe('isTxSendMethod', () => {
    it('returns true for all tx send methods', () => {
      TX_SEND_METHODS.forEach(method => {
        expect(isTxSendMethod(method)).toBe(true)
      })
    })

    it('returns false for signing-only methods', () => {
      const signingMethods = [
        RpcMethod.PERSONAL_SIGN,
        RpcMethod.SIGN_TYPED_DATA_V4,
        RpcMethod.SIGN_TYPED_DATA_V3,
        RpcMethod.SIGN_TYPED_DATA_V1,
        RpcMethod.SIGN_TYPED_DATA,
        RpcMethod.ETH_SIGN,
        RpcMethod.AVALANCHE_SIGN_MESSAGE,
        RpcMethod.SOLANA_SIGN_MESSAGE,
        RpcMethod.SOLANA_SIGN_TRANSACTION,
        RpcMethod.BITCOIN_SIGN_TRANSACTION,
        RpcMethod.AVALANCHE_SIGN_TRANSACTION
      ]
      signingMethods.forEach(method => {
        expect(isTxSendMethod(method)).toBe(false)
      })
    })

    it('works with plain string values (not just RpcMethod enum)', () => {
      expect(isTxSendMethod('eth_sendTransaction')).toBe(true)
      expect(isTxSendMethod('avalanche_sendTransaction')).toBe(true)
      expect(isTxSendMethod('personal_sign')).toBe(false)
      expect(isTxSendMethod('unknown_method')).toBe(false)
    })

    it('returns false for non-transaction methods', () => {
      const otherMethods = [
        RpcMethod.ETH_REQUEST_ACCOUNTS,
        RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
        RpcMethod.AVALANCHE_GET_ACCOUNTS,
        RpcMethod.AVALANCHE_CREATE_CONTACT,
        RpcMethod.WC_SESSION_REQUEST
      ]
      otherMethods.forEach(method => {
        expect(isTxSendMethod(method)).toBe(false)
      })
    })
  })
})
