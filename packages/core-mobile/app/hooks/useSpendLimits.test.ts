import { renderHook } from '@testing-library/react-hooks'
import { TokenType } from '@avalabs/vm-module-types'
import { MaxUint256 } from 'ethers'
import Web3 from 'web3'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { Limit, useSpendLimits } from './useSpendLimits'

const SPENDER = '0x1111111111111111111111111111111111111111'
const TOKEN = '0x2222222222222222222222222222222222222222'

// Encode an ERC-20 approve() the same way updateSpendLimit does, so the test
// feeds the hook the exact override-calldata shape it produces at runtime.
const encodeApprove = (amount: string): string => {
  const web3 = new Web3()
  const contract = new web3.eth.Contract(ERC20.abi as never, TOKEN)
  return contract.methods.approve?.(SPENDER, amount).encodeABI() as string
}

// Default approval of 1 USDC (6 decimals).
const DEFAULT_BN = 1_000_000n

const tokenApprovals = {
  isEditable: true,
  approvals: [
    {
      token: {
        type: TokenType.ERC20,
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        address: TOKEN
      },
      value: '0x' + DEFAULT_BN.toString(16),
      spenderAddress: SPENDER
    }
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

describe('useSpendLimits', () => {
  it('shows the default limit when no override is seeded', () => {
    const { result } = renderHook(() => useSpendLimits(tokenApprovals))
    expect(result.current.spendLimits[0]?.limitType).toBe(Limit.DEFAULT)
    expect(result.current.spendLimits[0]?.value?.bn).toBe(DEFAULT_BN)
    expect(result.current.hashedCustomSpend).toBeUndefined()
  })

  it('seeds a CUSTOM display and hashedCustomSpend from an override calldata', () => {
    const customBn = 5_000_000n // 5 USDC
    const calldata = encodeApprove(customBn.toString())
    const { result } = renderHook(() =>
      useSpendLimits(tokenApprovals, calldata)
    )
    expect(result.current.spendLimits[0]?.limitType).toBe(Limit.CUSTOM)
    expect(result.current.spendLimits[0]?.value?.bn).toBe(customBn)
    // The signed value the hook reports must match the seeded override so the
    // display and what gets signed stay in sync.
    expect(result.current.hashedCustomSpend).toBe(calldata)
  })

  it('seeds an UNLIMITED display from a max-approval override calldata', () => {
    const calldata = encodeApprove(MaxUint256.toString())
    const { result } = renderHook(() =>
      useSpendLimits(tokenApprovals, calldata)
    )
    expect(result.current.spendLimits[0]?.limitType).toBe(Limit.UNLIMITED)
    expect(result.current.spendLimits[0]?.value).toBeUndefined()
  })

  it('treats an override equal to the default as a DEFAULT selection', () => {
    const calldata = encodeApprove(DEFAULT_BN.toString())
    const { result } = renderHook(() =>
      useSpendLimits(tokenApprovals, calldata)
    )
    expect(result.current.spendLimits[0]?.limitType).toBe(Limit.DEFAULT)
    expect(result.current.spendLimits[0]?.value?.bn).toBe(DEFAULT_BN)
  })
})
