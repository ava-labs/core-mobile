import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRecurringAllowance } from './useRecurringAllowance'

const mockReadAllowance = jest.fn()
const mockFetchRouter = jest.fn()
jest.mock('../services/AllowanceService', () => ({
  readErc20Allowance: (...args: unknown[]) => mockReadAllowance(...args),
  fetchRouterAddress: (...args: unknown[]) => mockFetchRouter(...args)
}))

const wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('useRecurringAllowance', () => {
  beforeEach(() => {
    mockReadAllowance.mockReset()
    mockFetchRouter.mockReset()
  })

  it('reports needsApproval=true when allowance < totalAmountIn', async () => {
    mockFetchRouter.mockResolvedValueOnce('0xrouter')
    mockReadAllowance.mockResolvedValueOnce(50n)
    const { result, waitFor } = renderHook(
      () =>
        useRecurringAllowance({
          ownerAddress: '0xabc',
          chainId: 43114,
          tokenIn: '0xtoken',
          totalAmountIn: 100n
        }),
      { wrapper: wrap }
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toMatchObject({
      needsApproval: true,
      allowance: 50n,
      router: '0xrouter'
    })
  })

  it('reports needsApproval=false when allowance >= totalAmountIn', async () => {
    mockFetchRouter.mockResolvedValueOnce('0xrouter')
    mockReadAllowance.mockResolvedValueOnce(200n)
    const { result, waitFor } = renderHook(
      () =>
        useRecurringAllowance({
          ownerAddress: '0xabc',
          chainId: 43114,
          tokenIn: '0xtoken',
          totalAmountIn: 100n
        }),
      { wrapper: wrap }
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.needsApproval).toBe(false)
  })
})
