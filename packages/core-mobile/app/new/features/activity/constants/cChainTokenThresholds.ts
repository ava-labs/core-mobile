/**
 * Minimum token amounts for Avalanche C-Chain mainnet activity when no USD price
 * is available (matches product token_thresholds config).
 */
export type CChainTokenThresholdRow = {
  ticker: string
  quantity: number
  contractAddress: string | null
  /** Optional product / source note (not used by filter logic). */
  note?: string
}

export const C_CHAIN_TOKEN_THRESHOLDS: CChainTokenThresholdRow[] = [
  { ticker: 'AVAX', quantity: 0.001, contractAddress: null },
  {
    ticker: 'WAVAX',
    quantity: 0.001,
    contractAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
  },
  {
    ticker: 'USDC',
    quantity: 0.01,
    contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  },
  {
    ticker: 'AUSD',
    quantity: 0.01,
    contractAddress: '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a'
  },
  {
    ticker: 'USDT',
    quantity: 0.01,
    contractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'
  },
  {
    ticker: 'EURC',
    quantity: 0.01,
    contractAddress: '0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD'
  },
  {
    ticker: 'EUROP',
    quantity: 0.01,
    contractAddress: '0x8835A2F66A7AaCCB297Cb985831A616B75e2E16c'
  },
  {
    ticker: 'SOL',
    quantity: 0.00011,
    contractAddress: '0xFE6B19286885a4F7F55AdAD09C3Cd1f906D2478F',
    note: 'Wormhole-bridged Wrapped SOL on Avalanche C-Chain.'
  },
  {
    ticker: 'WETH.e',
    quantity: 0.000005,
    contractAddress: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB'
  },
  {
    ticker: 'BTC.b',
    quantity: 0.000000014,
    contractAddress: '0x152b9d0FdC40C096757F570A51E494bd4b943E50'
  }
]
