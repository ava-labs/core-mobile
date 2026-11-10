import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import { avalancheGetAccountPubKeyHandler as handler } from './avalanche_getAccountPubKey'

const mockGetSession = jest.fn()
jest.mock('services/walletconnectv2/WalletConnectService', () => ({
  __esModule: true,
  default: {
    getSession: (topic: string) => mockGetSession(topic)
  }
}))

const mockGetPublicKey = jest.fn()
jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: {
    getPublicKey: (...args: unknown[]) => mockGetPublicKey(...args)
  }
}))

jest.mock('store/account', () => ({
  selectActiveAccount: () => mockAccounts['0']
}))

jest.mock('store/wallet/slice', () => ({
  selectActiveWallet: () => ({ id: 'wallet-1', type: 'MNEMONIC' })
}))

const ACTIVE_C = mockAccounts['0'].addressC
const OTHER_C = mockAccounts['1'].addressC
const PUBLIC_KEY = { evm: '0xpub', xp: '0xpubxp' }

const listenerApi = { getState: jest.fn() } as never

const baseRequest: RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY> = {
  provider: RpcProvider.WALLET_CONNECT,
  method: RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
  data: {
    id: 1,
    topic: mockSession.topic,
    params: {
      request: { method: RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY, params: {} },
      chainId: 'eip155:43114'
    }
  },
  peerMeta: mockSession.peer.metadata
}

const sessionApproving = (address: string): unknown => ({
  ...mockSession,
  namespaces: {
    eip155: {
      ...mockSession.namespaces.eip155,
      accounts: [`eip155:43114:${address}`]
    }
  }
})

const withVerify = (
  validation: 'VALID' | 'UNKNOWN',
  origin: string
): RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY> => ({
  ...baseRequest,
  data: {
    ...baseRequest.data,
    verifyContext: { verified: { validation, origin, verifyUrl: '' } }
  }
})

describe('avalanche_getAccountPubKey handler', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockGetPublicKey.mockReset()
    mockGetPublicKey.mockResolvedValue(PUBLIC_KEY)
  })

  it('returns the public key when the active account is approved for the session', async () => {
    mockGetSession.mockReturnValue(sessionApproving(ACTIVE_C))
    const result = await handler.handle(baseRequest, listenerApi)
    expect(result).toEqual({ success: true, value: PUBLIC_KEY })
  })

  it('refuses a peer claiming the Core extension when the active account is not approved', async () => {
    mockGetSession.mockReturnValue(sessionApproving(OTHER_C))
    const result = await handler.handle(
      withVerify(
        'UNKNOWN',
        'chrome-extension://agoakfejjabomempkjlepdflaleeobhb'
      ),
      listenerApi
    )
    expect(result.success).toBe(false)
    expect(mockGetPublicKey).not.toHaveBeenCalled()
  })

  it('returns the public key to a Verify-attested Core app regardless of the session', async () => {
    mockGetSession.mockReturnValue(sessionApproving(OTHER_C))
    const result = await handler.handle(
      withVerify('VALID', 'https://core.app'),
      listenerApi
    )
    expect(result).toEqual({ success: true, value: PUBLIC_KEY })
  })

  it('returns the public key to in-app requests', async () => {
    const result = await handler.handle(
      { ...baseRequest, provider: RpcProvider.CORE_MOBILE },
      listenerApi
    )
    expect(result).toEqual({ success: true, value: PUBLIC_KEY })
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('refuses a WalletConnect request with no session', async () => {
    mockGetSession.mockReturnValue(undefined)
    const result = await handler.handle(baseRequest, listenerApi)
    expect(result.success).toBe(false)
    expect(mockGetPublicKey).not.toHaveBeenCalled()
  })
})
