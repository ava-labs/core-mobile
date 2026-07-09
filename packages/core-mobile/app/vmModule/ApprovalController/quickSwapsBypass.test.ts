import { AlertType } from '@avalabs/vm-module-types'
import { evaluateBatchApproval } from './quickSwapsBypass'
import { approvalValidators } from './validators'

// `approvalValidators` is mocked as a mutable array so each test can
// install the exact validator behavior it needs. Default: empty (no
// validator matches → manual screen), matching the recurring case.
jest.mock('./validators', () => ({
  approvalValidators: [],
  requestValidators: []
}))

const mockValidators = approvalValidators as unknown as Array<{
  canHandle: jest.Mock
  validate: jest.Mock
}>

describe('evaluateBatchApproval', () => {
  const baseParams = (method: string) =>
    ({
      request: { method, context: {} },
      displayData: {},
      signingRequests: [
        { signingData: { data: { chainId: 43114 } } },
        { signingData: { data: { chainId: 43114 } } }
      ]
    } as never)

  afterEach(() => {
    // Reset the shared mutable validator array between tests.
    mockValidators.length = 0
  })

  it('returns kind:manual when no validator matches (recurring, no auto-approve)', async () => {
    const result = await evaluateBatchApproval(
      baseParams('eth_sendTransactionBatch')
    )
    expect(result.kind).toBe('manual')
  })

  it('returns kind:manual (and injects a WARNING fallback alert) when the matched validator requires manual approval', async () => {
    // A flagged Quick-Swaps batch (validator matches via SWAP_AUTO_APPROVE
    // context, but the safety check defers to manual review) must open the
    // BatchApprovalScreen — NOT auto-approve and NOT bounce a marker error
    // back to EvmSigner. This documents the routing after the dead
    // per-tx-marker fallback was removed. CP-14641.
    mockValidators.push({
      canHandle: jest.fn().mockReturnValue(true),
      validate: jest.fn().mockResolvedValue({
        isValid: false,
        requiresManualApproval: true,
        reason: 'slippage exceeded'
      })
    })

    const params = baseParams('eth_sendTransactionBatch')
    const result = await evaluateBatchApproval(params)

    expect(result.kind).toBe('manual')
    // The fallback WARNING alert is surfaced on the batch screen so the
    // user sees why auto-approval was declined.
    expect(
      (params as { displayData: { alert?: unknown } }).displayData.alert
    ).toEqual({
      type: AlertType.WARNING,
      details: {
        title: 'Manual approval required',
        description: 'Manual approval required\nslippage exceeded'
      }
    })
  })
})
