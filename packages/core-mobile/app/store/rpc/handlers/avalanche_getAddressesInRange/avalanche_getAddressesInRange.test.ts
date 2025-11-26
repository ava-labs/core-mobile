import { RpcMethod, RpcProvider } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockWallets from 'tests/fixtures/wallets.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import * as getAddressesFromXpubXPModule from 'utils/getAddressesFromXpubXP'
import { WalletType } from 'services/wallet/types'
import { avalancheGetAddressesInRangeHandler } from './avalanche_getAddressesInRange'
import { AvalancheGetAddressesInRangeRpcRequest } from './types'

jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: () => true
  }
})

const mockActiveWallet = mockWallets['wallet-1']
jest.mock('store/wallet/slice', () => {
  const actual = jest.requireActual('store/wallet/slice')
  return {
    ...actual,
    selectActiveWallet: () => mockActiveWallet
  }
})

jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectActiveAccount: () => mockAccounts['1']
  }
})

jest
  .spyOn(getAddressesFromXpubXPModule, 'getAddressesFromXpubXP')
  .mockResolvedValue({
    externalAddresses: [
      { address: 'fuji1abc', index: 0 },
      { address: 'fuji1def', index: 1 }
    ],
    internalAddresses: [{ address: 'fuji1ghi', index: 0 }]
  })

const createRequest = (): AvalancheGetAddressesInRangeRpcRequest => ({
  provider: RpcProvider.WALLET_CONNECT,
  method: RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
  data: {
    id: 1,
    topic: '1',
    params: {
      request: {
        method: RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
        params: [] // no longer relevant since indices are gone
      },
      chainId: 'eip155:43114'
    }
  },
  peerMeta: mockSession.peer.metadata
})

describe('avalanche_getAddressesInRangeHandler', () => {
  const mockListenerApi = {
    getState: () => ({
      settings: { advanced: { developerMode: true } }
    }),
    dispatch: jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  it('returns error if no active wallet', async () => {
    jest
      .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
      .mockReturnValueOnce(null)

    const result = await avalancheGetAddressesInRangeHandler.handle(
      createRequest(),
      mockListenerApi
    )

    expect(result).toEqual({
      success: false,
      error: rpcErrors.internal('No active wallet')
    })
  })

  it('returns 1 account address for PRIVATE_KEY wallet', async () => {
    jest
      .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
      .mockReturnValueOnce({
        ...mockActiveWallet,
        type: WalletType.PRIVATE_KEY
      })
    const result = await avalancheGetAddressesInRangeHandler.handle(
      createRequest(),
      mockListenerApi
    )

    expect(result.success).toBe(true)
    // @ts-ignore
    expect(result.value).toEqual({
      external: ['fuji1e0r8s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n'],
      internal: []
    })
  })

  it('returns empty arrays for SEEDLESS wallet', async () => {
    jest
      .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
      .mockReturnValueOnce({ ...mockActiveWallet, type: WalletType.SEEDLESS })

    const result = await avalancheGetAddressesInRangeHandler.handle(
      createRequest(),
      mockListenerApi
    )

    expect(result.success).toBe(true)
    // @ts-ignore
    expect(result.value).toEqual({
      external: [],
      internal: []
    })
  })

  it('returns empty arrays for LEDGER_LIVE wallet', async () => {
    jest
      .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
      .mockReturnValueOnce({
        ...mockActiveWallet,
        type: WalletType.LEDGER_LIVE
      })

    const result = await avalancheGetAddressesInRangeHandler.handle(
      createRequest(),
      mockListenerApi
    )

    expect(result.success).toBe(true)
    // @ts-ignore
    expect(result.value).toEqual({
      external: [],
      internal: []
    })
  })

  describe('returns all addresses from xpubXP for all other wallet types', () => {
    it('MNEMONIC wallet', async () => {
      jest
        .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
        .mockReturnValueOnce({ ...mockActiveWallet, type: WalletType.MNEMONIC })

      const result = await avalancheGetAddressesInRangeHandler.handle(
        createRequest(),
        mockListenerApi
      )

      expect(
        getAddressesFromXpubXPModule.getAddressesFromXpubXP
      ).toHaveBeenCalled()

      expect(result).toEqual({
        success: true,
        value: {
          external: ['fuji1abc', 'fuji1def'],
          internal: ['fuji1ghi']
        }
      })
    })

    it('KEYSTONE wallet', async () => {
      jest
        .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
        .mockReturnValueOnce({ ...mockActiveWallet, type: WalletType.KEYSTONE })

      const result = await avalancheGetAddressesInRangeHandler.handle(
        createRequest(),
        mockListenerApi
      )

      expect(
        getAddressesFromXpubXPModule.getAddressesFromXpubXP
      ).toHaveBeenCalled()

      expect(result).toEqual({
        success: true,
        value: {
          external: ['fuji1abc', 'fuji1def'],
          internal: ['fuji1ghi']
        }
      })
    })

    it('LEDGER wallet', async () => {
      jest
        .spyOn(require('store/wallet/slice'), 'selectActiveWallet')
        .mockReturnValueOnce({ ...mockActiveWallet, type: WalletType.LEDGER })

      const result = await avalancheGetAddressesInRangeHandler.handle(
        createRequest(),
        mockListenerApi
      )

      expect(
        getAddressesFromXpubXPModule.getAddressesFromXpubXP
      ).toHaveBeenCalled()

      expect(result).toEqual({
        success: true,
        value: {
          external: ['fuji1abc', 'fuji1def'],
          internal: ['fuji1ghi']
        }
      })
    })
  })

  it('returns error when getAddressesFromXpubXP throws', async () => {
    jest
      .spyOn(getAddressesFromXpubXPModule, 'getAddressesFromXpubXP')
      .mockRejectedValueOnce(new Error('network error'))

    const result = await avalancheGetAddressesInRangeHandler.handle(
      createRequest(),
      mockListenerApi
    )

    expect(result.success).toBe(false)
    // @ts-ignore
    expect(result.error).toEqual(rpcErrors.internal('network error'))
  })
})
