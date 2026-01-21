// Benqi Comptroller ABI - only the claimReward function we need
export const BENQI_COMPTROLLER_ABI = [
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint8',
        name: 'rewardType',
        type: 'uint8'
      },
      {
        internalType: 'address payable',
        name: 'holder',
        type: 'address'
      }
    ],
    name: 'claimReward',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const
