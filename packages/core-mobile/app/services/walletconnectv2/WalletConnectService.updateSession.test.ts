import { SessionTypes } from '@walletconnect/types'
import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account'
import WalletConnectService from './WalletConnectService'

const mockShowSnackbar = jest.fn()
jest.mock('new/common/utils/toast', () => ({
  showSnackbar: (...args: unknown[]) => mockShowSnackbar(...args)
}))

const APPROVED_ADDRESS = '0x241b0073b66bfc19FCB54308861f604F5Eb8f51b'
const UNAPPROVED_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const makeAccount = (addressC: string): Account =>
  ({
    name: 'Account 1',
    id: 'account-id',
    index: 0,
    type: CoreAccountType.PRIMARY,
    walletId: 'wallet-id',
    addressC,
    addressAVM: 'AVMAddress',
    addressPVM: 'PVMAddress',
    addressBTC: 'BTCAddress',
    addressCoreEth: 'CoreEthAddress',
    addressSVM: 'SVMAddress'
  } as Account)

// `optionalNamespaces` mirrors a dApp that proposed both chains, so the network
// switch in the happy-path test is a chain the dApp actually asked for.
const makeSession = (
  declaredChains: string[] = ['eip155:1', 'eip155:137']
): SessionTypes.Struct =>
  ({
    topic: 'topic-1',
    peer: { metadata: { name: 'dApp', url: 'https://dapp.test' } },
    namespaces: {
      eip155: {
        chains: ['eip155:1'],
        accounts: [`eip155:1:${APPROVED_ADDRESS}`],
        methods: ['eth_sendTransaction'],
        events: ['chainChanged', 'accountsChanged']
      }
    },
    requiredNamespaces: {},
    optionalNamespaces: { eip155: { chains: declaredChains } }
  } as unknown as SessionTypes.Struct)

const updateSession = jest.fn().mockResolvedValue(undefined)
const emitSessionEvent = jest.fn().mockResolvedValue(undefined)
const ping = jest.fn().mockResolvedValue(undefined)

beforeEach(() => {
  updateSession.mockClear()
  emitSessionEvent.mockClear()
  ping.mockClear()
  mockShowSnackbar.mockClear()
  // @ts-expect-error — inject a stand-in for the WalletKit client
  WalletConnectService.client = {
    updateSession,
    emitSessionEvent,
    engine: { signClient: { ping } }
  }
})

describe('WalletConnectService.updateSession', () => {
  it('S3: tells the user when the active account is not in the approved set', async () => {
    const result = await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS),
      notifyUnapprovedAccount: true
    })
    expect(result).toBe(false)
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      'This dApp is connected to a different account. Switch accounts in the dApp.'
    )
    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('S3: no snackbar for an unapproved account when notify is omitted', async () => {
    const result = await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })
    expect(result).toBe(false)
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('S3: does not show the snackbar for an approved account', async () => {
    const result = await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(APPROVED_ADDRESS),
      notifyUnapprovedAccount: true
    })
    expect(result).toBe(true)
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('S3: updateSessions shows at most one snackbar across unapproved sessions', async () => {
    const s1 = { ...makeSession(), topic: 't1' }
    const s2 = { ...makeSession(), topic: 't2' }
    // @ts-expect-error — inject a stand-in for the WalletKit client
    WalletConnectService.client = {
      updateSession,
      emitSessionEvent,
      engine: { signClient: { ping } },
      getActiveSessions: () => ({ t1: s1, t2: s2 })
    }
    await WalletConnectService.updateSessions({
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS),
      notifyUnapprovedAccount: true
    })
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1)
  })

  it('R2-6: does nothing for a chain the session never declared', async () => {
    const session = makeSession(['eip155:1']) // 137 undeclared
    await WalletConnectService.updateSession({
      session,
      chainId: 137,
      account: makeAccount(APPROVED_ADDRESS)
    })
    expect(updateSession).not.toHaveBeenCalled()
    expect(emitSessionEvent).not.toHaveBeenCalled()
    expect(session.namespaces.eip155?.accounts).not.toContain(
      `eip155:137:${APPROVED_ADDRESS}`
    )
  })

  it('R2-6: undeclared chain + unapproved account pushes nothing and emits no events', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(['eip155:1']),
      chainId: 137,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })
    const calls = updateSession.mock.calls
    calls.forEach(([arg]) => {
      expect(arg.namespaces.eip155.accounts).toEqual([
        `eip155:1:${APPROVED_ADDRESS}`
      ])
      expect(arg.namespaces.eip155.chains).toEqual(['eip155:1'])
    })
    expect(emitSessionEvent).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('syncs the chain and emits events for an approved account', async () => {
    const session = makeSession()

    await WalletConnectService.updateSession({
      session,
      chainId: 137,
      account: makeAccount(APPROVED_ADDRESS)
    })

    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.accounts).toEqual([
      `eip155:1:${APPROVED_ADDRESS}`,
      `eip155:137:${APPROVED_ADDRESS}`
    ])
    expect(namespaces.eip155.chains).toEqual(['eip155:1', 'eip155:137'])

    const events = emitSessionEvent.mock.calls.map(([arg]) => arg.event)
    expect(events).toEqual([
      { name: 'chainChanged', data: 137 },
      { name: 'accountsChanged', data: [`eip155:137:${APPROVED_ADDRESS}`] }
    ])
  })

  it('does not add an account the session was never approved for', async () => {
    const session = makeSession()

    await WalletConnectService.updateSession({
      session,
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })

    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.accounts).toEqual([`eip155:1:${APPROVED_ADDRESS}`])
    expect(namespaces.eip155.chains).toEqual(['eip155:1'])
  })

  it('emits no accountsChanged for an unapproved account', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })

    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('does not leak an unapproved account when the network also changes', async () => {
    const session = makeSession()

    await WalletConnectService.updateSession({
      session,
      chainId: 43114,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })

    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.accounts).toEqual([`eip155:1:${APPROVED_ADDRESS}`])
    expect(namespaces.eip155.chains).not.toContain('eip155:43114')
    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('still pushes the session so a wagmi dApp picks up approved methods/events', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })

    expect(updateSession).toHaveBeenCalledTimes(1)
  })
})

// The chain axis: an approved account is necessary but not sufficient — the
// chain must also be one the dApp proposed.
describe('WalletConnectService.updateSession chain scope', () => {
  it('does not extend the session to a chain the dApp never proposed', async () => {
    await WalletConnectService.updateSession({
      // dApp only ever declared eip155:1.
      session: makeSession(['eip155:1']),
      chainId: 56,
      account: makeAccount(APPROVED_ADDRESS)
    })

    // an undeclared chain short-circuits before any session update is pushed
    expect(updateSession).not.toHaveBeenCalled()
    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('still extends to a chain the dApp declared as optional', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(['eip155:1', 'eip155:56']),
      chainId: 56,
      account: makeAccount(APPROVED_ADDRESS)
    })

    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.chains).toEqual(['eip155:1', 'eip155:56'])
  })
})
