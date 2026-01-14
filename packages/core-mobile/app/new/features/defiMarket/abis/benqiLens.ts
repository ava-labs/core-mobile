export const BENQI_LENS_ABI = [
  {
    inputs: [
      {
        internalType: 'contract Comptroller',
        name: '_comptroller',
        type: 'address'
      },
      {
        internalType: 'contract PglStakingContract',
        name: '_pglStakingContract',
        type: 'address'
      },
      {
        internalType: 'contract PglStakingContract',
        name: '_jlpStakingContract',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_pangolinRouter',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_traderJoeRouter',
        type: 'address'
      },
      {
        internalType: 'contract QiToken',
        name: '_qiQi',
        type: 'address'
      },
      {
        internalType: 'contract QiToken',
        name: '_qiAvax',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'comptroller',
    outputs: [
      {
        internalType: 'contract Comptroller',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'getAccountLpSnapshot',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'balance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'deposited',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'unclaimedQi',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'stakingContractAllowance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'routerQiAllowance',
            type: 'uint256'
          }
        ],
        internalType: 'struct Lens.AccountLpSnapshot',
        name: '',
        type: 'tuple'
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'balance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'deposited',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'unclaimedQi',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'stakingContractAllowance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'routerQiAllowance',
            type: 'uint256'
          }
        ],
        internalType: 'struct Lens.AccountLpSnapshot',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'contract QiToken',
        name: 'market',
        type: 'address'
      }
    ],
    name: 'getAccountMarketSnapshot',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'market',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'balance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'allowance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'supplyBalance',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'borrowBalance',
            type: 'uint256'
          },
          {
            internalType: 'bool',
            name: 'collateralEnabled',
            type: 'bool'
          }
        ],
        internalType: 'struct Lens.AccountMarketSnapshot',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'getAccountSnapshot',
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'address',
                name: 'market',
                type: 'address'
              },
              {
                internalType: 'uint256',
                name: 'balance',
                type: 'uint256'
              },
              {
                internalType: 'uint256',
                name: 'allowance',
                type: 'uint256'
              },
              {
                internalType: 'uint256',
                name: 'supplyBalance',
                type: 'uint256'
              },
              {
                internalType: 'uint256',
                name: 'borrowBalance',
                type: 'uint256'
              },
              {
                internalType: 'bool',
                name: 'collateralEnabled',
                type: 'bool'
              }
            ],
            internalType: 'struct Lens.AccountMarketSnapshot[]',
            name: 'accountMarketSnapshots',
            type: 'tuple[]'
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'unclaimedAvax',
                type: 'uint256'
              },
              {
                internalType: 'uint256',
                name: 'unclaimdQi',
                type: 'uint256'
              },
              {
                internalType: 'address[]',
                name: 'markets',
                type: 'address[]'
              }
            ],
            internalType: 'struct Lens.AccountRewards',
            name: 'rewards',
            type: 'tuple'
          }
        ],
        internalType: 'struct Lens.AccountSnapshot',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      },
      {
        internalType: 'uint8',
        name: 'rewardType',
        type: 'uint8'
      }
    ],
    name: 'getClaimableReward',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMarketLpSnapshot',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'totalDepositedLpTokenAmount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lpTokenTotalSupply',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lpQiReserves',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lpAvaxReserves',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'kLast',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'apr',
            type: 'uint256'
          }
        ],
        internalType: 'struct Lens.MarketLpSnapshot',
        name: '',
        type: 'tuple'
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'totalDepositedLpTokenAmount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lpTokenTotalSupply',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lpQiReserves',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lpAvaxReserves',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'kLast',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'apr',
            type: 'uint256'
          }
        ],
        internalType: 'struct Lens.MarketLpSnapshot',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract QiToken',
        name: 'market',
        type: 'address'
      }
    ],
    name: 'getMarketMetadata',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'market',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'supplyRate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'borrowRate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'price',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'exchangeRate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'reserveFactor',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'borrowCap',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalSupply',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalUnderlyingSupply',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalBorrows',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'collateralFactor',
            type: 'uint256'
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'token',
                type: 'address'
              },
              {
                internalType: 'uint256',
                name: 'decimals',
                type: 'uint256'
              },
              {
                internalType: 'string',
                name: 'symbol',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'name',
                type: 'string'
              }
            ],
            internalType: 'struct Lens.Token',
            name: 'underlying',
            type: 'tuple'
          },
          {
            internalType: 'uint256',
            name: 'qiTokenDecimals',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'avaxSupplyRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'avaxBorrowRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'qiSupplyRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'qiBorrowRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalReserves',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'cash',
            type: 'uint256'
          },
          {
            internalType: 'bool',
            name: 'mintPaused',
            type: 'bool'
          },
          {
            internalType: 'bool',
            name: 'borrowPaused',
            type: 'bool'
          }
        ],
        internalType: 'struct Lens.MarketMetadata',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMarketMetadataForAllMarkets',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'market',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'supplyRate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'borrowRate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'price',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'exchangeRate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'reserveFactor',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'borrowCap',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalSupply',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalUnderlyingSupply',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalBorrows',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'collateralFactor',
            type: 'uint256'
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'token',
                type: 'address'
              },
              {
                internalType: 'uint256',
                name: 'decimals',
                type: 'uint256'
              },
              {
                internalType: 'string',
                name: 'symbol',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'name',
                type: 'string'
              }
            ],
            internalType: 'struct Lens.Token',
            name: 'underlying',
            type: 'tuple'
          },
          {
            internalType: 'uint256',
            name: 'qiTokenDecimals',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'avaxSupplyRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'avaxBorrowRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'qiSupplyRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'qiBorrowRewardSpeed',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'totalReserves',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'cash',
            type: 'uint256'
          },
          {
            internalType: 'bool',
            name: 'mintPaused',
            type: 'bool'
          },
          {
            internalType: 'bool',
            name: 'borrowPaused',
            type: 'bool'
          }
        ],
        internalType: 'struct Lens.MarketMetadata[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'jlpStakingContract',
    outputs: [
      {
        internalType: 'contract PglStakingContract',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pangolinRouter',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pglStakingContract',
    outputs: [
      {
        internalType: 'contract PglStakingContract',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'qiAvax',
    outputs: [
      {
        internalType: 'contract QiToken',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'qiQi',
    outputs: [
      {
        internalType: 'contract QiToken',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'traderJoeRouter',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const
