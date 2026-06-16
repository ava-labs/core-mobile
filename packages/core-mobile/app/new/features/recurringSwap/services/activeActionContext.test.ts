import {
  aggregatorIdToActionType,
  clearActiveRecurringActionContext,
  getActiveRecurringActionContext,
  isRecurringAggregatorId,
  setActiveRecurringActionContext
} from './activeActionContext'

describe('activeActionContext', () => {
  beforeEach(() => {
    clearActiveRecurringActionContext('fill')
    clearActiveRecurringActionContext('cancel')
    clearActiveRecurringActionContext('pause')
    clearActiveRecurringActionContext('unpause')
  })

  it('returns undefined when no context has been set', () => {
    expect(getActiveRecurringActionContext('markr-recurring')).toBeUndefined()
  })

  it('returns undefined for a non-recurring aggregator id even when a slot is set', () => {
    setActiveRecurringActionContext({
      type: 'cancel',
      fromTokenSymbol: 'A',
      toTokenSymbol: 'B'
    })
    expect(getActiveRecurringActionContext('paraswap')).toBeUndefined()
    expect(getActiveRecurringActionContext(undefined)).toBeUndefined()
  })

  it('round-trips a fill context through set/get/clear', () => {
    setActiveRecurringActionContext({
      type: 'fill',
      fromTokenSymbol: 'LINK',
      toTokenSymbol: 'AVAX',
      amountPerOrderFormatted: '15.00',
      numberOfOrders: 4,
      isUnlimited: false,
      frequency: { unit: 'week', value: 4 }
    })

    expect(getActiveRecurringActionContext('markr-recurring')).toEqual({
      type: 'fill',
      fromTokenSymbol: 'LINK',
      toTokenSymbol: 'AVAX',
      amountPerOrderFormatted: '15.00',
      numberOfOrders: 4,
      isUnlimited: false,
      frequency: { unit: 'week', value: 4 }
    })

    clearActiveRecurringActionContext('fill')
    expect(getActiveRecurringActionContext('markr-recurring')).toBeUndefined()
  })

  it('keeps fill and order-action slots independent (no cross-stomp)', () => {
    // Concurrent fill + cancel: both stash their own slot, and the signer
    // resolves which one applies via the SDK's aggregator id. This is the
    // race the per-type design exists to prevent — the previous single
    // slot would silently mislabel the fill's second sign with the
    // cancel's context.
    setActiveRecurringActionContext({
      type: 'fill',
      fromTokenSymbol: 'LINK',
      toTokenSymbol: 'AVAX',
      amountPerOrderFormatted: '15.00',
      numberOfOrders: 4,
      isUnlimited: false,
      frequency: { unit: 'week', value: 4 }
    })
    setActiveRecurringActionContext({
      type: 'cancel',
      fromTokenSymbol: 'USDC',
      toTokenSymbol: 'AVAX'
    })

    expect(getActiveRecurringActionContext('markr-recurring')?.type).toBe(
      'fill'
    )
    expect(
      getActiveRecurringActionContext('markr-recurring-cancel')?.type
    ).toBe('cancel')

    // Clearing one slot leaves the other intact.
    clearActiveRecurringActionContext('cancel')
    expect(
      getActiveRecurringActionContext('markr-recurring-cancel')
    ).toBeUndefined()
    expect(getActiveRecurringActionContext('markr-recurring')?.type).toBe(
      'fill'
    )
  })

  it('overwrites a slot when set is called twice for the same type', () => {
    setActiveRecurringActionContext({
      type: 'pause',
      fromTokenSymbol: 'A',
      toTokenSymbol: 'B'
    })
    setActiveRecurringActionContext({
      type: 'pause',
      fromTokenSymbol: 'C',
      toTokenSymbol: 'D'
    })

    expect(getActiveRecurringActionContext('markr-recurring-pause')).toEqual({
      type: 'pause',
      fromTokenSymbol: 'C',
      toTokenSymbol: 'D'
    })
  })
})

describe('aggregatorIdToActionType', () => {
  it.each([
    ['markr-recurring', 'fill'],
    ['markr-recurring-cancel', 'cancel'],
    ['markr-recurring-pause', 'pause'],
    ['markr-recurring-unpause', 'unpause']
  ] as const)('maps %s → %s', (id, expected) => {
    expect(aggregatorIdToActionType(id)).toBe(expected)
  })

  it.each([undefined, '', 'markr', 'markr-other', 'paraswap'])(
    'returns undefined for %s',
    id => {
      expect(aggregatorIdToActionType(id)).toBeUndefined()
    }
  )
})

describe('isRecurringAggregatorId', () => {
  it.each([
    'markr-recurring',
    'markr-recurring-cancel',
    'markr-recurring-pause',
    'markr-recurring-unpause'
  ])('matches %s', id => {
    expect(isRecurringAggregatorId(id)).toBe(true)
  })

  it.each([undefined, '', 'markr', 'paraswap', 'recurring', 'markr-other'])(
    'does NOT match %s',
    id => {
      expect(isRecurringAggregatorId(id)).toBe(false)
    }
  )
})
