// Merkl Distributor ABI - only the claim function we need
export const MERKL_DISTRIBUTOR_ABI = [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'users',
        type: 'address[]'
      },
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      },
      {
        internalType: 'bytes32[][]',
        name: 'proofs',
        type: 'bytes32[][]'
      }
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const
