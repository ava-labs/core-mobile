import { Alert, AlertType } from '@avalabs/vm-module-types'
import { getAlertMessage } from 'features/approval/screens/ApprovalScreen/utils'
import WalletService from 'services/wallet/WalletService'
import { evaluateBatchApproval, signBatchRequests } from './quickSwapsBypass'
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
    // user sees why auto-approval was declined. Title and description are kept
    // as separate fields — the sheets compose them (see getAlertMessage), so
    // the title is no longer baked into the description.
    const alert = (params as { displayData: { alert?: Alert } }).displayData
      .alert

    expect(alert).toEqual({
      type: AlertType.WARNING,
      details: {
        title: 'Manual approval required',
        description: 'slippage exceeded'
      }
    })
    // What the user actually reads is unchanged by that split.
    expect(getAlertMessage(alert)).toBe(
      'Manual approval required\nslippage exceeded'
    )
  })
})

describe('signBatchRequests signer verification', () => {
  const FROM = '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'

  const request = (context: Record<string, unknown>) =>
    ({ requestId: '1', sessionId: 'core-mobile', context } as never)

  const fullContext = {
    walletId: 'w1',
    walletType: 'MNEMONIC',
    accountIndex: 0,
    fromAddress: FROM,
    network: { chainId: 43114 }
  }

  it('passes the signer address through to WalletService', async () => {
    const signSpy = jest
      .spyOn(WalletService, 'sign')
      .mockResolvedValue('0xsigned')

    const result = await signBatchRequests(
      request(fullContext),
      [{ to: FROM, value: 0n } as never],
      'eth_sendTransactionBatch'
    )

    expect(result).toEqual({ signedTxs: [{ signedData: '0xsigned' }] })
    expect(signSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fromAddress: FROM })
    )
    signSpy.mockRestore()
  })

  it('refuses to sign when the context carries no signer address', async () => {
    const signSpy = jest.spyOn(WalletService, 'sign')
    const { fromAddress: _dropped, ...withoutAddress } = fullContext

    const result = await signBatchRequests(
      request(withoutAddress),
      [{ to: FROM, value: 0n } as never],
      'eth_sendTransactionBatch'
    )

    expect(result).toEqual({
      error: expect.objectContaining({
        message: expect.stringContaining('signing context missing')
      })
    })
    expect(signSpy).not.toHaveBeenCalled()
    signSpy.mockRestore()
  })
})
