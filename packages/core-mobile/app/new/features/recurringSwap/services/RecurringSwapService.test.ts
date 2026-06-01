import { RecurringSwapService } from './RecurringSwapService'

describe('RecurringSwapService', () => {
  const fetchMock = jest.fn()
  const service = new RecurringSwapService({
    baseUrl: 'https://orchestrator.markr.io',
    bearerToken: 'test-token',
    fetch: fetchMock as unknown as typeof fetch
  })

  beforeEach(() => fetchMock.mockReset())

  describe('recurringQuote', () => {
    it('maps NumberOfOrders === Infinity to numberOfOrders: 365 in the POST body', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uuid: 'u',
            appId: '0x' + 'a'.repeat(64),
            chainId: 43114,
            tokenIn: '0x' + 'b'.repeat(40),
            tokenOut: '0x' + 'c'.repeat(40),
            amount: '1',
            numberOfOrders: 365,
            frequency: { unit: 'day', value: 1 },
            totalAmountIn: '365',
            fees: [],
            recommendedSlippage: 50,
            expiredAt: 0
          }),
          { status: 200 }
        )
      )

      await service.recurringQuote({
        appId: '0x' + 'a'.repeat(64),
        chainId: 43114,
        tokenIn: '0x' + 'b'.repeat(40),
        tokenInDecimals: 18,
        tokenOut: '0x' + 'c'.repeat(40),
        tokenOutDecimals: 18,
        amount: '1',
        numberOfOrders: Infinity,
        frequency: { unit: 'day', value: 1 }
      })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(body.numberOfOrders).toBe(365)
    })

    it('renames slippageBps (local) to slippage (wire) in the POST body', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uuid: 'u',
            appId: '0x' + 'a'.repeat(64),
            chainId: 43114,
            tokenIn: '0x' + 'b'.repeat(40),
            tokenOut: '0x' + 'c'.repeat(40),
            amount: '1',
            numberOfOrders: 4,
            frequency: { unit: 'day', value: 1 },
            totalAmountIn: '4',
            fees: [],
            recommendedSlippage: 50,
            expiredAt: 0
          }),
          { status: 200 }
        )
      )

      await service.recurringQuote({
        appId: '0x' + 'a'.repeat(64),
        chainId: 43114,
        tokenIn: '0x' + 'b'.repeat(40),
        tokenInDecimals: 18,
        tokenOut: '0x' + 'c'.repeat(40),
        tokenOutDecimals: 18,
        amount: '1',
        numberOfOrders: 4,
        frequency: { unit: 'day', value: 1 },
        slippageBps: 50
      })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(body.slippage).toBe(50)
      expect(body.slippageBps).toBeUndefined()
    })

    it('throws on non-2xx with the error body', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Quote expired!' }), { status: 400 })
      )

      await expect(
        service.recurringQuote({
          appId: '0x' + 'a'.repeat(64),
          chainId: 43114,
          tokenIn: '0x' + 'b'.repeat(40),
          tokenInDecimals: 18,
          tokenOut: '0x' + 'c'.repeat(40),
          tokenOutDecimals: 18,
          amount: '1',
          numberOfOrders: 4,
          frequency: { unit: 'day', value: 1 }
        })
      ).rejects.toThrow('Quote expired!')
    })
  })

  describe('recurringSwap', () => {
    it('POSTs only { uuid, appId } to /recurring/swap', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ from: '0x0', to: '0x1', data: '0xfeed', value: '0' }),
          { status: 200 }
        )
      )
      await service.recurringSwap({ uuid: 'u', appId: '0x' + 'a'.repeat(64) })
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(body).toEqual({ uuid: 'u', appId: '0x' + 'a'.repeat(64) })
      const url = fetchMock.mock.calls[0][0]
      expect(url).toContain('/recurring/swap')
    })
  })
})
