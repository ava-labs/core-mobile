import { RecurringSchedulesService } from './RecurringSchedulesService'

describe('RecurringSchedulesService', () => {
  const baseUrl = 'https://orchestrator.example/test'
  const bearer = 'tok'
  let fetchMock: jest.Mock
  let service: RecurringSchedulesService

  beforeEach(() => {
    fetchMock = jest.fn()
    service = new RecurringSchedulesService({ baseUrl, bearerToken: bearer, fetch: fetchMock as any })
  })

  it('list builds the query string with address + optional chainId/status', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      address: '0xabc', count: 0, orders: []
    }), { status: 200 }))
    await service.list({ address: '0xABC', chainId: 43114, status: 'active' })
    const url = new URL(fetchMock.mock.calls[0]![0] as string)
    expect(url.pathname).toBe('/test/recurring/orders')
    expect(url.searchParams.get('address')).toBe('0xABC')
    expect(url.searchParams.get('chainId')).toBe('43114')
    expect(url.searchParams.get('status')).toBe('active')
  })

  it('list omits chainId and status when not supplied', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      address: '0xabc', count: 0, orders: []
    }), { status: 200 }))
    await service.list({ address: '0xABC' })
    const url = new URL(fetchMock.mock.calls[0]![0] as string)
    expect(url.searchParams.get('address')).toBe('0xABC')
    expect(url.searchParams.has('chainId')).toBe(false)
    expect(url.searchParams.has('status')).toBe(false)
  })

  it('list returns orders array', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      address: '0xabc', count: 1, orders: [{ orderId: '0xdead', status: 'active' }]
    }), { status: 200 }))
    const out = await service.list({ address: '0xabc' })
    expect(out).toEqual([{ orderId: '0xdead', status: 'active' }])
  })

  it('cancel posts to /recurring/orders/{orderId}/cancel with address body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      orderId: '0xdead', status: 'cancelled', cancelledAt: 1
    }), { status: 200 }))
    const out = await service.cancel({ orderId: '0xdead', address: '0xabc' })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toContain('/recurring/orders/0xdead/cancel')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ address: '0xabc' })
    expect(out.status).toBe('cancelled')
  })

  it('cancel treats 400 "order not cancellable" as a typed error', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      error: 'Order is already completed'
    }), { status: 400 }))
    await expect(service.cancel({ orderId: '0xdead', address: '0xabc' }))
      .rejects.toMatchObject({ kind: 'not_cancellable' })
  })

  it('cancel treats 404 as not_found', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 404 }))
    await expect(service.cancel({ orderId: '0xdead', address: '0xabc' }))
      .rejects.toMatchObject({ kind: 'not_found' })
  })

  it('list treats 401 as unauthorized error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }))
    await expect(service.list({ address: '0xABC' }))
      .rejects.toMatchObject({ kind: 'unauthorized' })
  })

  it('list throws generic Error for non-401 non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    await expect(service.list({ address: '0xABC' }))
      .rejects.toThrow('recurring/orders 500')
  })

  it('cancel treats 401 as unauthorized error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(service.cancel({ orderId: '0xdead', address: '0xabc' }))
      .rejects.toMatchObject({ kind: 'unauthorized' })
  })
})
