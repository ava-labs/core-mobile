import { evaluateBatchApproval } from './quickSwapsBypass'

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

  it('returns kind:manual when no validator matches (recurring, no auto-approve)', async () => {
    const result = await evaluateBatchApproval(
      baseParams('eth_sendTransactionBatch')
    )
    expect(result.kind).toBe('manual')
  })
})
