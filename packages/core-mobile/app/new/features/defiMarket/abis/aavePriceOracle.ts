// AAVE V3 Price Oracle ABI (partial)
export const AAVE_PRICE_ORACLE_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'asset',
        type: 'address'
      }
    ],
    name: 'getAssetPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const
