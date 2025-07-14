import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import bs58 from 'bs58'
import {
  transformSolanaMessageParams,
  getSolanaAccountFromParams,
  transformSolanaTransactionParams,
  transformSolanaParams
} from './solanaRequestUtils'

const TEST_CONSTANTS = {
  SOLANA_ACCOUNT: 'solana123',
  TEST_SESSION_ACCOUNT: 'testAccount123',
  MESSAGE: {
    PLAIN: 'Hello',
    BASE58: 'JCGDhKKjkBT', // Base58 encoded "Hello"
    // We should expect the base64 of the base58-decoded message
    BASE64: Buffer.from(bs58.decode('JCGDhKKjkBT')).toString('base64')
  },
  TRANSACTION: {
    ENCODED: 'base64EncodedTransaction'
  },
  SESSION: {
    TOPIC: 'test-topic',
    CHAIN: 'solana:mainnet',
    APP_NAME: 'Test App',
    APP_URL: 'https://test.com',
    APP_DESCRIPTION: 'Test Description',
    PUBLIC_KEY: 'test-public-key'
  }
} as const

const createMockSession = (
  accounts: string[] = [
    `${TEST_CONSTANTS.SESSION.CHAIN}:${TEST_CONSTANTS.TEST_SESSION_ACCOUNT}`
  ]
): SessionTypes.Struct => ({
  topic: TEST_CONSTANTS.SESSION.TOPIC,
  relay: { protocol: 'test' },
  expiry: 0,
  pairingTopic: TEST_CONSTANTS.SESSION.TOPIC,
  requiredNamespaces: {},
  optionalNamespaces: {},
  namespaces: {
    solana: {
      chains: [TEST_CONSTANTS.SESSION.CHAIN],
      accounts,
      methods: [],
      events: []
    }
  },
  acknowledged: true,
  controller: 'test',
  peer: {
    publicKey: TEST_CONSTANTS.SESSION.PUBLIC_KEY,
    metadata: {
      name: TEST_CONSTANTS.SESSION.APP_NAME,
      description: TEST_CONSTANTS.SESSION.APP_DESCRIPTION,
      url: TEST_CONSTANTS.SESSION.APP_URL,
      icons: []
    }
  },
  self: {
    metadata: {
      name: TEST_CONSTANTS.SESSION.APP_NAME,
      description: TEST_CONSTANTS.SESSION.APP_DESCRIPTION,
      url: TEST_CONSTANTS.SESSION.APP_URL,
      icons: []
    },
    publicKey: TEST_CONSTANTS.SESSION.PUBLIC_KEY
  }
})

describe('solanaRequestUtils', () => {
  describe('transformSolanaMessageParams', () => {
    it('should transform valid Solana message params', () => {
      const params = {
        pubkey: TEST_CONSTANTS.SOLANA_ACCOUNT,
        message: TEST_CONSTANTS.MESSAGE.BASE58
      }

      const result = transformSolanaMessageParams(params)

      expect(result).toEqual([
        {
          account: TEST_CONSTANTS.SOLANA_ACCOUNT,
          serializedMessage: TEST_CONSTANTS.MESSAGE.BASE64
        }
      ])
    })

    it('should return undefined for invalid params', () => {
      const invalidParams = [
        {},
        { pubkey: 'test' },
        { message: 'test' },
        null,
        undefined,
        'invalid'
      ]

      invalidParams.forEach(params => {
        expect(transformSolanaMessageParams(params)).toBeUndefined()
      })
    })
  })

  describe('getSolanaAccountFromParams', () => {
    const mockSession = createMockSession()

    it('should get account from params when pubkey is present', () => {
      const params = {
        pubkey: TEST_CONSTANTS.SOLANA_ACCOUNT,
        transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
      }

      const result = getSolanaAccountFromParams(params, mockSession)
      expect(result).toBe(TEST_CONSTANTS.SOLANA_ACCOUNT)
    })

    it('should fall back to session account when pubkey is not in params', () => {
      const params = {
        transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
      }

      const result = getSolanaAccountFromParams(params, mockSession)
      expect(result).toBe(TEST_CONSTANTS.TEST_SESSION_ACCOUNT)
    })

    it('should throw error when no account is found', () => {
      const params = {
        transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
      }
      const sessionWithoutAccount = createMockSession([])

      expect(() =>
        getSolanaAccountFromParams(params, sessionWithoutAccount)
      ).toThrow('No Solana account found in params or session')
    })
  })

  describe('transformSolanaTransactionParams', () => {
    const mockSession = createMockSession()

    it('should transform valid Solana transaction params with pubkey', () => {
      const params = {
        pubkey: TEST_CONSTANTS.SOLANA_ACCOUNT,
        transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
      }

      const result = transformSolanaTransactionParams(params, mockSession)

      expect(result).toEqual([
        {
          account: TEST_CONSTANTS.SOLANA_ACCOUNT,
          serializedTx: TEST_CONSTANTS.TRANSACTION.ENCODED
        }
      ])
    })

    it('should transform valid Solana transaction params using session account', () => {
      const params = {
        transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
      }

      const result = transformSolanaTransactionParams(params, mockSession)

      expect(result).toEqual([
        {
          account: TEST_CONSTANTS.TEST_SESSION_ACCOUNT,
          serializedTx: TEST_CONSTANTS.TRANSACTION.ENCODED
        }
      ])
    })

    it('should return undefined for invalid params', () => {
      const invalidParams = [
        {},
        [],
        null,
        undefined,
        'invalid',
        { pubkey: 'test' }
      ]

      invalidParams.forEach(params => {
        expect(
          transformSolanaTransactionParams(params, mockSession)
        ).toBeUndefined()
      })
    })

    it('should throw error when no account is found', () => {
      const params = {
        transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
      }
      const sessionWithoutAccount = createMockSession([])

      expect(() =>
        transformSolanaTransactionParams(params, sessionWithoutAccount)
      ).toThrow('No Solana account found in params or session')
    })
  })

  describe('transformSolanaParams', () => {
    const mockSession = createMockSession()

    it('should transform solana_signMessage params', () => {
      const requestEvent = {
        params: {
          request: {
            method: 'solana_signMessage',
            params: {
              pubkey: TEST_CONSTANTS.SOLANA_ACCOUNT,
              message: TEST_CONSTANTS.MESSAGE.BASE58
            }
          }
        }
      } as SignClientTypes.EventArguments['session_request']

      transformSolanaParams(requestEvent, mockSession)

      expect(requestEvent.params.request.params).toEqual([
        {
          account: TEST_CONSTANTS.SOLANA_ACCOUNT,
          serializedMessage: TEST_CONSTANTS.MESSAGE.BASE64
        }
      ])
    })

    it('should transform solana_signTransaction params', () => {
      const requestEvent = {
        params: {
          request: {
            method: 'solana_signTransaction',
            params: {
              pubkey: TEST_CONSTANTS.SOLANA_ACCOUNT,
              transaction: TEST_CONSTANTS.TRANSACTION.ENCODED
            }
          }
        }
      } as SignClientTypes.EventArguments['session_request']

      transformSolanaParams(requestEvent, mockSession)

      expect(requestEvent.params.request.params).toEqual([
        {
          account: TEST_CONSTANTS.SOLANA_ACCOUNT,
          serializedTx: TEST_CONSTANTS.TRANSACTION.ENCODED
        }
      ])
    })

    it('should not modify params for non-Solana methods', () => {
      const originalParams = { someParam: 'value' }
      const requestEvent = {
        params: {
          request: {
            method: 'eth_signTransaction',
            params: originalParams
          }
        }
      } as SignClientTypes.EventArguments['session_request']

      transformSolanaParams(requestEvent, mockSession)

      expect(requestEvent.params.request.params).toBe(originalParams)
    })
  })
})
