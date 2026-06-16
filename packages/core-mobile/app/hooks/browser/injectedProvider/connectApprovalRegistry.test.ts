import { Account } from 'store/account/types'
import { connectApprovalRegistry } from './connectApprovalRegistry'

const SUPERSEDED = { code: 4001, message: 'superseded' }
const TIMEOUT = { code: -32603, message: 'timeout' }
const ACCOUNTS = [{ id: 'acc' }] as unknown as Account[]

// Register a request; returns the minted approvalId, the nav effect, and the
// approve/reject spies so tests can assert settlement.
const register = (
  tabId: string,
  requestId: number
): {
  approvalId: string
  effect: ReturnType<typeof connectApprovalRegistry.request>['effect']
  approve: jest.Mock
  reject: jest.Mock
} => {
  const approve = jest.fn()
  const reject = jest.fn()
  const { approvalId, effect } = connectApprovalRegistry.request(
    {
      tabId,
      requestId,
      peerMeta: { name: 'd', description: '', url: 'https://d', icons: [] },
      approve,
      reject
    },
    SUPERSEDED
  )
  return { approvalId, effect, approve, reject }
}

describe('connectApprovalRegistry', () => {
  beforeEach(() => connectApprovalRegistry._resetForTests())

  it('opens the modal for the first request and queues a concurrent tab', () => {
    const a = register('tabA', 1)
    expect(a.effect).toEqual({ type: 'open', approvalId: a.approvalId })

    const b = register('tabB', 1)
    expect(b.effect).toEqual({ type: 'none' })
  })

  it('mints a unique approvalId per request (reused requestId does NOT collide)', () => {
    const a1 = register('tabA', 1)
    const a2 = register('tabA', 1) // same tab + same reused requestId (page reload)
    expect(a2.approvalId).not.toEqual(a1.approvalId)
  })

  it('advances to the next queued approval when the active one resolves', () => {
    const a = register('tabA', 1)
    const b = register('tabB', 1)

    expect(connectApprovalRegistry.resolve(a.approvalId, ACCOUNTS)).toEqual({
      type: 'replace',
      approvalId: b.approvalId
    })
    expect(a.approve).toHaveBeenCalledWith(ACCOUNTS)
  })

  it('dismisses when the last approval is settled', () => {
    const a = register('tabA', 1)
    expect(connectApprovalRegistry.reject(a.approvalId, TIMEOUT)).toEqual({
      type: 'dismiss'
    })
    expect(a.reject).toHaveBeenCalledWith(TIMEOUT)
  })

  it('settling a queued (non-active) approval does not disturb the active modal', () => {
    const a = register('tabA', 1)
    const b = register('tabB', 1)

    expect(connectApprovalRegistry.reject(b.approvalId, TIMEOUT)).toEqual({
      type: 'none'
    })
    expect(b.reject).toHaveBeenCalledWith(TIMEOUT)
    expect(connectApprovalRegistry.resolve(a.approvalId, ACCOUNTS)).toEqual({
      type: 'dismiss'
    })
  })

  it('same-tab supersede of the ACTIVE approval replaces in place and rejects the old', () => {
    const a1 = register('tabA', 1)
    const a2 = register('tabA', 2)

    expect(a2.effect).toEqual({ type: 'replace', approvalId: a2.approvalId })
    expect(a1.reject).toHaveBeenCalledWith(SUPERSEDED)
  })

  it('same-tab supersede keeps queue position when a sibling tab is queued (CP-14385 review case)', () => {
    const a1 = register('tabA', 1) // A1 active
    const b1 = register('tabB', 1) // B1 queued
    const a2 = register('tabA', 2) // supersedes A1

    expect(a2.effect).toEqual({ type: 'replace', approvalId: a2.approvalId })
    expect(a1.reject).toHaveBeenCalledWith(SUPERSEDED)
    // Resolving A2 then advances to B1 (which kept its queued slot).
    expect(connectApprovalRegistry.resolve(a2.approvalId, ACCOUNTS)).toEqual({
      type: 'replace',
      approvalId: b1.approvalId
    })
  })

  it('same-tab supersede of a QUEUED approval keeps it queued (no modal change)', () => {
    const a1 = register('tabA', 1) // active
    register('tabB', 1) // B1 queued
    const b2 = register('tabB', 2) // supersedes B1 (queued)

    expect(b2.effect).toEqual({ type: 'none' })
    // A1 still active; advancing goes to B2 (B1's old slot).
    expect(connectApprovalRegistry.resolve(a1.approvalId, ACCOUNTS)).toEqual({
      type: 'replace',
      approvalId: b2.approvalId
    })
  })

  it('rejectByTab rejects only that tab and advances if the active one was its', () => {
    const a = register('tabA', 1)
    const b = register('tabB', 1)

    expect(connectApprovalRegistry.rejectByTab('tabA', TIMEOUT)).toEqual({
      type: 'replace',
      approvalId: b.approvalId
    })
    expect(a.reject).toHaveBeenCalledWith(TIMEOUT)
    expect(b.reject).not.toHaveBeenCalled()
  })

  it('rejectByTab on a queued tab does not move the active modal', () => {
    register('tabA', 1)
    const b = register('tabB', 1)

    expect(connectApprovalRegistry.rejectByTab('tabB', TIMEOUT)).toEqual({
      type: 'none'
    })
    expect(b.reject).toHaveBeenCalledWith(TIMEOUT)
  })

  it('settling an unknown approvalId is a no-op', () => {
    expect(connectApprovalRegistry.resolve('nope:1:0', ACCOUNTS)).toEqual({
      type: 'none'
    })
  })

  it('hasActive reflects whether any approval is showing', () => {
    expect(connectApprovalRegistry.hasActive()).toBe(false)
    const a = register('tabA', 1)
    expect(connectApprovalRegistry.hasActive()).toBe(true)
    connectApprovalRegistry.resolve(a.approvalId, ACCOUNTS)
    expect(connectApprovalRegistry.hasActive()).toBe(false)
  })
})
