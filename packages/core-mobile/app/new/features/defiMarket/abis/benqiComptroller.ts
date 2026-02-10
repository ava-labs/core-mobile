// Benqi Comptroller ABI
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
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'getAssetsIn',
    outputs: [
      {
        internalType: 'contract QiToken[]',
        name: '',
        type: 'address[]'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address[]',
        name: 'qiTokens',
        type: 'address[]'
      }
    ],
    name: 'enterMarkets',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'qiTokenAddress',
        type: 'address'
      }
    ],
    name: 'exitMarket',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'getAccountLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'error',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'shortfall',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'qiTokenModify',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'redeemTokens',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'borrowAmount',
        type: 'uint256'
      }
    ],
    name: 'getHypotheticalAccountLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'error',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'shortfall',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
] as const
