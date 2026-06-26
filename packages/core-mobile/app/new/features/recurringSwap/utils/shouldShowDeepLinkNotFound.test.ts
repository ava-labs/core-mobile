import { shouldShowDeepLinkNotFound } from './shouldShowDeepLinkNotFound'

const BASE = {
  initialExpandedOrderId: '0xmissing',
  isLoading: false,
  isError: false,
  alreadyShown: false,
  orderIds: ['0xaaa', '0xbbb'] as const
}

describe('shouldShowDeepLinkNotFound', () => {
  // The core case the reviewer asked to cover: fetch settled, the deep-linked
  // id isn't in the list → fire the snackbar (once).
  it('is true when the deep-linked id is absent after a successful fetch', () => {
    expect(shouldShowDeepLinkNotFound(BASE)).toBe(true)
  })

  it('is false when the deep-linked id is present in the list', () => {
    expect(
      shouldShowDeepLinkNotFound({ ...BASE, initialExpandedOrderId: '0xaaa' })
    ).toBe(false)
  })

  it('is false when there is no deep-linked orderId', () => {
    expect(
      shouldShowDeepLinkNotFound({ ...BASE, initialExpandedOrderId: undefined })
    ).toBe(false)
  })

  // While loading or on error the snackbar must not fire — the fetch hasn't
  // settled (loading) or the inline Retry CTA already covers it (error).
  it('is false while loading', () => {
    expect(shouldShowDeepLinkNotFound({ ...BASE, isLoading: true })).toBe(false)
  })

  it('is false on a fetch error', () => {
    expect(shouldShowDeepLinkNotFound({ ...BASE, isError: true })).toBe(false)
  })

  // The one-shot guard: once shown, it stays suppressed even if the id is still
  // absent on subsequent re-runs (e.g. a background refetch).
  it('is false once it has already been shown', () => {
    expect(shouldShowDeepLinkNotFound({ ...BASE, alreadyShown: true })).toBe(
      false
    )
  })

  it('is true when the list is empty and a deep link is present', () => {
    expect(shouldShowDeepLinkNotFound({ ...BASE, orderIds: [] })).toBe(true)
  })
})
