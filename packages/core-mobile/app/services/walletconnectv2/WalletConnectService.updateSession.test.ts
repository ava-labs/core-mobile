import { SessionTypes } from '@walletconnect/types'
import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account'
import WalletConnectService from './WalletConnectService'

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
  // @ts-expect-error — inject a stand-in for the WalletKit client
  WalletConnectService.client = {
    updateSession,
    emitSessionEvent,
    engine: { signClient: { ping } }
  }
})

// CP-15152: the active account follows into every session, like 1.0.41.
describe('WalletConnectService.updateSession account switch', () => {
  it('adds an account not in the session and emits accountsChanged', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS),
      addActiveAccount: true
    })

    expect(ping).toHaveBeenCalledWith({ topic: 'topic-1' })
    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.accounts).toEqual([
      `eip155:1:${APPROVED_ADDRESS}`,
      `eip155:1:${UNAPPROVED_ADDRESS}`
    ])

    const events = emitSessionEvent.mock.calls.map(([arg]) => arg.event)
    expect(events).toEqual([
      { name: 'chainChanged', data: 1 },
      { name: 'accountsChanged', data: [`eip155:1:${UNAPPROVED_ADDRESS}`] }
    ])
  })

  it('updateSessions adds the account to every session without a snackbar', async () => {
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
      addActiveAccount: true
    })

    expect(updateSession).toHaveBeenCalledTimes(2)
    for (const [{ namespaces }] of updateSession.mock.calls) {
      expect(namespaces.eip155.accounts).toContain(
        `eip155:1:${UNAPPROVED_ADDRESS}`
      )
    }
    const accountsChanged = emitSessionEvent.mock.calls.filter(
      ([arg]) => arg.event.name === 'accountsChanged'
    )
    expect(accountsChanged).toHaveLength(2)
  })

  it('syncs the chain and emits events for an approved account', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
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
})

// The chain axis is still gated: only chains the dApp proposed are synced.
describe('WalletConnectService.updateSession chain scope', () => {
  it('does nothing for a chain the session never declared', async () => {
    const session = makeSession(['eip155:1'])

    await WalletConnectService.updateSession({
      session,
      chainId: 56,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })

    expect(updateSession).not.toHaveBeenCalled()
    expect(emitSessionEvent).not.toHaveBeenCalled()
    expect(session.namespaces.eip155?.accounts).toEqual([
      `eip155:1:${APPROVED_ADDRESS}`
    ])
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

// The post-approval refresh (addActiveAccount: false) must not expose an active
// account the user did not pick on the connect screen.
describe('WalletConnectService.updateSession post-approval refresh', () => {
  it('defaults to not adding or announcing an unapproved active account', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS)
    })

    expect(updateSession).toHaveBeenCalledTimes(1)
    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.accounts).toEqual([`eip155:1:${APPROVED_ADDRESS}`])
    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('pushes the session without adding or announcing an unapproved active account', async () => {
    const session = makeSession()

    await WalletConnectService.updateSessionWithTimeout({
      session,
      chainId: 1,
      account: makeAccount(UNAPPROVED_ADDRESS),
      addActiveAccount: false
    })

    expect(updateSession).toHaveBeenCalledTimes(1)
    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.accounts).toEqual([`eip155:1:${APPROVED_ADDRESS}`])
    expect(namespaces.eip155.methods).toEqual(['eth_sendTransaction'])
    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('keeps chains unchanged when the unapproved account is on another chain', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 137,
      account: makeAccount(UNAPPROVED_ADDRESS),
      addActiveAccount: false
    })

    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.chains).toEqual(['eip155:1'])
    expect(namespaces.eip155.accounts).toEqual([`eip155:1:${APPROVED_ADDRESS}`])
    expect(emitSessionEvent).not.toHaveBeenCalled()
  })

  it('still syncs and emits events when the active account was approved', async () => {
    await WalletConnectService.updateSession({
      session: makeSession(),
      chainId: 137,
      // checksum casing differs from the approved entry on purpose
      account: makeAccount(APPROVED_ADDRESS.toLowerCase()),
      addActiveAccount: false
    })

    const { namespaces } = updateSession.mock.calls[0][0]
    expect(namespaces.eip155.chains).toEqual(['eip155:1', 'eip155:137'])
    const events = emitSessionEvent.mock.calls.map(([arg]) => arg.event)
    expect(events).toEqual([
      { name: 'chainChanged', data: 137 },
      {
        name: 'accountsChanged',
        data: [`eip155:137:${APPROVED_ADDRESS.toLowerCase()}`]
      }
    ])
  })
})
