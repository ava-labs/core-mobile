import { RecurringSwapMetadataSchema } from './schemas'

// The notification-center history API returns raw JSON (numbers stay numbers),
// while the FCM push stringifies every `data` value. The schema must accept
// both shapes — most importantly `reasonCode`, which the push sends as a string
// but history sends as a number. A failed notification ALWAYS carries a
// reasonCode, so a non-coercing schema drops the entire `data` block on the
// history path (regression: failure badge + terminal-state detection break).
describe('RecurringSwapMetadataSchema', () => {
  const base = {
    orderId: '0xorder',
    owner: '0xowner',
    tokenIn: '0xin',
    tokenOut: '0xout',
    amountIn: '1000000',
    amountOut: '2000000',
    status: 'failed'
  }

  it('parses the history-API shape (numeric counts + numeric reasonCode)', () => {
    const parsed = RecurringSwapMetadataSchema.safeParse({
      ...base,
      chainId: 43114,
      numberOfOrders: 5,
      executedOrders: 2,
      remainingOrders: 3,
      reasonCode: 1
    })
    expect(parsed.success).toBe(true)
    // reasonCode normalizes to a string regardless of the wire shape.
    expect(parsed.success && parsed.data.reasonCode).toBe('1')
  })

  it('parses the FCM push shape (all values stringified)', () => {
    const parsed = RecurringSwapMetadataSchema.safeParse({
      ...base,
      chainId: '43114',
      numberOfOrders: '5',
      executedOrders: '2',
      remainingOrders: '3',
      reasonCode: '1'
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.reasonCode).toBe('1')
  })

  it('parses a non-failed update with no reasonCode', () => {
    const parsed = RecurringSwapMetadataSchema.safeParse({
      ...base,
      status: 'active',
      chainId: 43114,
      numberOfOrders: 5,
      executedOrders: 2,
      remainingOrders: 3
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.reasonCode).toBeUndefined()
  })

  // Only `status` is required. A parse failure drops the entire `data` block
  // (→ `data: undefined`), which flips a terminal row back to tappable — the
  // regression this schema guards against. So a stray missing field from a
  // field no consumer renders must NOT take the whole block down: anything but
  // `status` is optional.
  it('parses a payload carrying only status (all other fields absent)', () => {
    const parsed = RecurringSwapMetadataSchema.safeParse({ status: 'failed' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.status).toBe('failed')
    expect(parsed.success && parsed.data.numberOfOrders).toBeUndefined()
    expect(parsed.success && parsed.data.remainingOrders).toBeUndefined()
  })

  it('still fails when status itself is missing', () => {
    const parsed = RecurringSwapMetadataSchema.safeParse({
      orderId: '0xorder',
      owner: '0xowner'
    })
    expect(parsed.success).toBe(false)
  })
})
