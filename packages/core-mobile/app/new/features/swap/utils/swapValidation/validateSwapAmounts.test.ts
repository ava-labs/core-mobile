import { validateSwapAmounts } from './validateSwapAmounts'
import {
  BalanceChangeItem,
  SwapValidationContext,
  SwapValidationInput,
  TokenBalanceChange
} from './types'

const SRC_TOKEN = '0xAAA0000000000000000000000000000000000001'
const DST_TOKEN = '0xBBB0000000000000000000000000000000000002'

const baseContext: SwapValidationContext = {
  srcTokenAddress: SRC_TOKEN,
  destTokenAddress: DST_TOKEN,
  isSrcTokenNative: false,
  isDestTokenNative: false,
  slippage: 50, // 0.5% in basis points
  minAmountOut: '99',
  maxBuy: 'unlimited'
}

const createMockTokenBalanceChange = (
  items: Array<Partial<BalanceChangeItem>>,
  tokenOverrides: { address?: string; decimals?: number } = {}
): TokenBalanceChange => ({
  token: {
    address: tokenOverrides.address ?? SRC_TOKEN,
    decimals: tokenOverrides.decimals ?? 0,
    symbol: 'TKN'
  },
  items: items.map(i => ({
    displayValue: i.displayValue ?? '1',
    usdPrice: i.usdPrice ?? '1',
    rawValue: i.rawValue
  }))
})

const goodInput = (
  overrides: Partial<SwapValidationInput> = {}
): SwapValidationInput => ({
  displayData: {
    isSimulationSuccessful: true,
    balanceChange: {
      outs: [
        createMockTokenBalanceChange([{ usdPrice: '100', displayValue: '1' }], {
          address: SRC_TOKEN,
          decimals: 0
        })
      ],
      ins: [
        createMockTokenBalanceChange(
          [{ usdPrice: '100', displayValue: '100' }],
          { address: DST_TOKEN, decimals: 0 }
        )
      ]
    }
  },
  context: baseContext,
  ...overrides
})

describe('validateSwapAmounts — happy path', () => {
  it('returns isValid:true when all checks pass and dest USD >= source USD', () => {
    const result = validateSwapAmounts(goodInput())
    expect(result.isValid).toBe(true)
  })

  it('returns isValid:true when dest USD < source USD but within slippage tolerance', () => {
    // Source $100, dest $99.6 (0.4% loss), slippage 0.5% bps → within tolerance.
    const input = goodInput({
      displayData: {
        isSimulationSuccessful: true,
        balanceChange: {
          outs: [
            createMockTokenBalanceChange(
              [{ usdPrice: '100', displayValue: '1' }],
              { decimals: 0 }
            )
          ],
          ins: [
            createMockTokenBalanceChange(
              [{ usdPrice: '99.6', displayValue: '100' }],
              { address: DST_TOKEN, decimals: 0 }
            )
          ]
        }
      }
    })
    const result = validateSwapAmounts(input)
    expect(result.isValid).toBe(true)
  })

  it('treats undefined isSimulationSuccessful as continue (does not hard reject)', () => {
    const input = goodInput()
    if (input.displayData) input.displayData.isSimulationSuccessful = undefined
    const result = validateSwapAmounts(input)
    expect(result.isValid).toBe(true)
  })

  it('passes when partner fee is enabled and total tolerance covers the loss', () => {
    // slippage 0.2% (20 bps) + Markr 0.85% = 1.05% tolerance.
    // Source $100, dest $99.0 (1% loss) → within tolerance.
    const result = validateSwapAmounts(
      goodInput({
        context: {
          ...baseContext,
          slippage: 20,
          partnerFeeBps: 85
        },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '99', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(true)
  })
})

describe('validateSwapAmounts — failure paths', () => {
  it('returns min_amount_out_missing when minAmountOut is undefined', () => {
    const result = validateSwapAmounts(
      goodInput({ context: { ...baseContext, minAmountOut: undefined } })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('min_amount_out_missing')
      expect(result.requiresManualApproval).toBe(true)
    }
  })

  it('returns min_amount_out_missing when minAmountOut is "0"', () => {
    const result = validateSwapAmounts(
      goodInput({ context: { ...baseContext, minAmountOut: '0' } })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('min_amount_out_missing')
  })

  it('hard-rejects when isSimulationSuccessful === false (the only hard-reject path)', () => {
    const input = goodInput()
    if (input.displayData) input.displayData.isSimulationSuccessful = false
    const result = validateSwapAmounts(input)
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('simulation_failed')
      expect(result.requiresManualApproval).toBe(false)
    }
  })

  it('returns balance_change_missing when displayData is undefined', () => {
    const result = validateSwapAmounts(goodInput({ displayData: undefined }))
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('balance_change_missing')
  })

  it('returns balance_change_missing when balanceChange is undefined', () => {
    const result = validateSwapAmounts(
      goodInput({ displayData: { isSimulationSuccessful: true } })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('balance_change_missing')
  })

  it('returns balance_change_missing when outs is empty', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: { outs: [], ins: [createMockTokenBalanceChange([{}])] }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('balance_change_missing')
  })

  it('returns balance_change_missing when ins is empty', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: { outs: [createMockTokenBalanceChange([{}])], ins: [] }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('balance_change_missing')
  })

  it('returns token_address_missing when non-native srcTokenAddress is undefined', () => {
    const result = validateSwapAmounts(
      goodInput({ context: { ...baseContext, srcTokenAddress: undefined } })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('token_address_missing')
  })

  it('returns token_address_missing when non-native destTokenAddress is undefined', () => {
    const result = validateSwapAmounts(
      goodInput({ context: { ...baseContext, destTokenAddress: undefined } })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('token_address_missing')
  })

  it('returns source_token_not_found when src not in outs', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange([{}], {
                address: '0xWRONG0000000000000000000000000000000000',
                decimals: 0
              })
            ],
            ins: [
              createMockTokenBalanceChange([{}], {
                address: DST_TOKEN,
                decimals: 0
              })
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('source_token_not_found')
  })

  it('returns destination_token_not_found when dest not in ins', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange([{}], {
                address: SRC_TOKEN,
                decimals: 0
              })
            ],
            ins: [
              createMockTokenBalanceChange([{}], {
                address: '0xWRONG0000000000000000000000000000000000',
                decimals: 0
              })
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('destination_token_not_found')
  })

  it('returns usd_pricing_unavailable when source token has no items', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange([], {
                address: SRC_TOKEN,
                decimals: 0
              })
            ],
            ins: [
              createMockTokenBalanceChange([{}], {
                address: DST_TOKEN,
                decimals: 0
              })
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('usd_pricing_unavailable')
  })

  it('returns usd_pricing_unavailable when destination token has no items', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange([{}], {
                address: SRC_TOKEN,
                decimals: 0
              })
            ],
            ins: [
              createMockTokenBalanceChange([], {
                address: DST_TOKEN,
                decimals: 0
              })
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('usd_pricing_unavailable')
  })

  it('returns usd_pricing_unavailable when source USD parses to 0', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '0', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('usd_pricing_unavailable')
  })

  it('returns amount_over_limit when source USD exceeds maxBuy cap', () => {
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, maxBuy: '1000' },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '5000', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '5000', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('amount_over_limit')
      expect(result.requiresManualApproval).toBe(true)
    }
  })

  it('returns slippage_unavailable when slippage is undefined and there is a loss', () => {
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, slippage: undefined },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '99', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('slippage_unavailable')
  })

  it('returns slippage_exceeded when loss is beyond slippage tolerance', () => {
    // Source $100, dest $98 (2% loss), slippage 50bps (0.5%) → exceeds.
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '98', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('slippage_exceeded')
  })

  it('returns slippage_exceeded when loss exceeds slippage even with partner fee', () => {
    // slippage 50bps + Markr 85bps = 1.35% tolerance.
    // Source $100, dest $98 (2% loss) → exceeds.
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, partnerFeeBps: 85 },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '98', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('slippage_exceeded')
  })

  it('returns amount_calculation_failed when destination token has no decimals', () => {
    const dst = createMockTokenBalanceChange(
      [{ usdPrice: '100', displayValue: '100' }],
      { address: DST_TOKEN }
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(dst.token as any).decimals = undefined
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [dst]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('amount_calculation_failed')
  })

  it('returns amount_calculation_failed when total received parses to 0', () => {
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '0' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('amount_calculation_failed')
  })

  it('returns amount_below_minimum when actual < minAmountOut', () => {
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, minAmountOut: '200' },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('amount_below_minimum')
  })
})

describe('validateSwapAmounts — native token matching', () => {
  it('auto-approves a native source token (e.g. AVAX → USDC) when isSrcTokenNative is true and srcTokenAddress is undefined', () => {
    const result = validateSwapAmounts({
      context: {
        ...baseContext,
        srcTokenAddress: undefined,
        isSrcTokenNative: true
      },
      displayData: {
        isSimulationSuccessful: true,
        balanceChange: {
          outs: [
            {
              token: { decimals: 18, symbol: 'AVAX', name: 'Avalanche' },
              items: [{ usdPrice: '100', displayValue: '1' }]
            }
          ],
          ins: [
            createMockTokenBalanceChange(
              [{ usdPrice: '100', displayValue: '100' }],
              { address: DST_TOKEN, decimals: 0 }
            )
          ]
        }
      }
    })
    expect(result.isValid).toBe(true)
  })

  it('matches a native destination by zero-address when isDestTokenNative is true', () => {
    const result = validateSwapAmounts({
      context: {
        ...baseContext,
        destTokenAddress: '0x0000000000000000000000000000000000000000',
        isDestTokenNative: true
      },
      displayData: {
        isSimulationSuccessful: true,
        balanceChange: {
          outs: [
            createMockTokenBalanceChange(
              [{ usdPrice: '100', displayValue: '1' }],
              { address: SRC_TOKEN, decimals: 0 }
            )
          ],
          ins: [
            {
              token: {
                address: '0x0000000000000000000000000000000000000000',
                decimals: 0,
                symbol: 'AVAX'
              },
              items: [{ usdPrice: '100', displayValue: '100' }]
            }
          ]
        }
      }
    })
    expect(result.isValid).toBe(true)
  })
})

describe('validateSwapAmounts — native source gas net-out', () => {
  // Real-world AVAX → USDC scenario from CP-14211 simulator testing:
  // 1 AVAX swap (1e18 raw) at $9.50, ~0.014 AVAX gas (~$0.13). Without
  // gas net-out, sourceUsd = $9.633 vs destUsd = $9.408 → 2.3% loss
  // exceeds the 1.05% (slippage 0.20% + Markr fee 0.85%) tolerance and
  // the validator wrongly falls back. With net-out, sourceUsd is scaled
  // down to $9.50 → 0.96% loss, within tolerance.
  const nativeSwapInput = (overrides: { gasUsd?: string } = {}) => ({
    context: {
      ...baseContext,
      srcTokenAddress: undefined,
      isSrcTokenNative: true,
      slippage: 20,
      partnerFeeBps: 85,
      amountIn: '1000000000000000000', // 1 AVAX raw
      minAmountOut: '9408000'
    },
    displayData: {
      isSimulationSuccessful: true,
      balanceChange: {
        outs: [
          {
            token: { decimals: 18, symbol: 'AVAX', name: 'Avalanche' },
            items: [
              {
                usdPrice: '9.50',
                displayValue: '1',
                rawValue: '1000000000000000000'
              },
              {
                usdPrice: overrides.gasUsd ?? '0.13',
                displayValue: '0.014',
                rawValue: '14000000000000000'
              }
            ]
          }
        ],
        ins: [
          createMockTokenBalanceChange(
            [{ usdPrice: '9.408', displayValue: '9.408', rawValue: '9408000' }],
            { address: DST_TOKEN, decimals: 6 }
          )
        ]
      }
    }
  })

  it('auto-approves a 1 AVAX → USDC swap once gas is netted out of source USD', () => {
    const result = validateSwapAmounts(nativeSwapInput())
    expect(result.isValid).toBe(true)
  })

  it('still rejects when post-net-out loss exceeds slippage + fee tolerance', () => {
    // Same shape but dest USD slashed: post-net-out loss > 1.05%.
    const input = nativeSwapInput()
    if (input.displayData?.balanceChange) {
      input.displayData.balanceChange.ins = [
        createMockTokenBalanceChange(
          [{ usdPrice: '9.20', displayValue: '9.408', rawValue: '9408000' }],
          { address: DST_TOKEN, decimals: 6 }
        )
      ]
    }
    const result = validateSwapAmounts(input)
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('slippage_exceeded')
  })

  it('does not net out gas when source is non-native (ERC-20)', () => {
    // For ERC-20 source, gas is paid in a different (native) token, so
    // the source-OUT bucket already reflects only the swap amount. The
    // amountIn arg should be ignored — verify by constructing a case
    // where netting-out would change the verdict.
    const result = validateSwapAmounts(
      goodInput({
        context: {
          ...baseContext,
          slippage: 20,
          partnerFeeBps: 85,
          amountIn: '500000000000000000' // half of total source out
        },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [
                  {
                    usdPrice: '9.50',
                    displayValue: '1',
                    rawValue: '1000000000000000000'
                  }
                ],
                { address: SRC_TOKEN, decimals: 18 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [
                  {
                    usdPrice: '9.408',
                    displayValue: '9.408',
                    rawValue: '9408000'
                  }
                ],
                { address: DST_TOKEN, decimals: 6 }
              )
            ]
          }
        }
      })
    )
    // Loss is ~0.97% (within 1.05% tolerance) — independent of amountIn,
    // because the net-out only kicks in for native sources.
    expect(result.isValid).toBe(true)
  })
})

describe('validateSwapAmounts — case-insensitive address matching', () => {
  it('matches src token regardless of case', () => {
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, srcTokenAddress: SRC_TOKEN.toUpperCase() },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN.toLowerCase(), decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(true)
  })
})

describe('validateSwapAmounts — multiple items per token', () => {
  it('sums USD values across multiple items on the source side', () => {
    // Two items totaling $100 on source, one $99 item on dest → 1% loss
    // exceeds 50bps slippage → slippage_exceeded.
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [
                  { usdPrice: '60', displayValue: '0.6' },
                  { usdPrice: '40', displayValue: '0.4' }
                ],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '99', displayValue: '99' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('slippage_exceeded')
  })

  it('sums raw amounts across multiple items on the destination side', () => {
    // Two items each "50" displayValue at decimals=0 → total 100 raw.
    // minAmountOut = "99" → passes.
    const result = validateSwapAmounts(
      goodInput({
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [
                  { usdPrice: '50', displayValue: '50' },
                  { usdPrice: '50', displayValue: '50' }
                ],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(true)
  })
})

describe('validateSwapAmounts — slippage in basis points (mobile adaptation)', () => {
  it('treats slippage=50 as 0.5% (basis points), not 50%', () => {
    // 50bps = 0.5%. Source $100, dest $99.5 (0.5% loss) — should pass.
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, slippage: 50 },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '99.5', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(true)
  })

  it('rejects 1% loss with 50bps slippage tolerance', () => {
    const result = validateSwapAmounts(
      goodInput({
        context: { ...baseContext, slippage: 50 },
        displayData: {
          isSimulationSuccessful: true,
          balanceChange: {
            outs: [
              createMockTokenBalanceChange(
                [{ usdPrice: '100', displayValue: '1' }],
                { address: SRC_TOKEN, decimals: 0 }
              )
            ],
            ins: [
              createMockTokenBalanceChange(
                [{ usdPrice: '99', displayValue: '100' }],
                { address: DST_TOKEN, decimals: 0 }
              )
            ]
          }
        }
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) expect(result.code).toBe('slippage_exceeded')
  })
})
