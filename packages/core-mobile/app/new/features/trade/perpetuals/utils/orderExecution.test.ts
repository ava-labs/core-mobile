const mockShowSnackbar = jest.fn()
jest.mock('common/utils/toast', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showSnackbar: (...args: any[]) => mockShowSnackbar(...args)
}))

import {
  AGENT_SESSION_EXPIRED_MESSAGE,
  isAgentSessionError,
  reportOrderError,
  toastPerpsExchangeError
} from './orderExecution'

const AGENT_MISSING =
  'Hyperliquid exchange: User or API Wallet 0x3fd13f3cd5743e70afeab702cb42199f9a67f055 does not exist.'

describe('isAgentSessionError', () => {
  it('matches the HL agent-missing rejection string', () => {
    expect(isAgentSessionError(AGENT_MISSING)).toBe(true)
  })
  it('matches the same message on a thrown Error', () => {
    expect(isAgentSessionError(new Error(AGENT_MISSING))).toBe(true)
  })
  it('ignores unrelated rejections', () => {
    expect(isAgentSessionError('Insufficient margin')).toBe(false)
    expect(isAgentSessionError(new Error('Order has invalid price'))).toBe(
      false
    )
  })
})

describe('toastPerpsExchangeError', () => {
  beforeEach(() => {
    mockShowSnackbar.mockReset()
  })

  it('invalidates the agent and shows the session-expired copy', () => {
    const onAgentInvalidated = jest.fn()
    toastPerpsExchangeError(AGENT_MISSING, onAgentInvalidated)
    expect(onAgentInvalidated).toHaveBeenCalledTimes(1)
    expect(mockShowSnackbar).toHaveBeenCalledWith(AGENT_SESSION_EXPIRED_MESSAGE)
  })

  it('shows the raw rejection for non-agent errors', () => {
    const onAgentInvalidated = jest.fn()
    toastPerpsExchangeError('Insufficient margin', onAgentInvalidated)
    expect(onAgentInvalidated).not.toHaveBeenCalled()
    expect(mockShowSnackbar).toHaveBeenCalledWith('Insufficient margin')
  })

  it('shows the raw rejection when no invalidation callback is wired', () => {
    toastPerpsExchangeError(AGENT_MISSING)
    expect(mockShowSnackbar).toHaveBeenCalledWith(AGENT_MISSING)
  })
})

describe('reportOrderError agent-session handling', () => {
  beforeEach(() => {
    mockShowSnackbar.mockReset()
  })

  it('invalidates the agent on a thrown agent-missing error', () => {
    const onAgentInvalidated = jest.fn()
    reportOrderError(
      new Error(AGENT_MISSING),
      'Order failed',
      onAgentInvalidated
    )
    expect(onAgentInvalidated).toHaveBeenCalledTimes(1)
    expect(mockShowSnackbar).toHaveBeenCalledWith(AGENT_SESSION_EXPIRED_MESSAGE)
  })

  it('keeps the normal message path for other errors', () => {
    const onAgentInvalidated = jest.fn()
    reportOrderError(new Error('boom'), 'Order failed', onAgentInvalidated)
    expect(onAgentInvalidated).not.toHaveBeenCalled()
    expect(mockShowSnackbar).toHaveBeenCalledWith('boom')
  })
})
