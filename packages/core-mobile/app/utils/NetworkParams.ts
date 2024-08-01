const NanoAvax = 1n
const MicroAvax = NanoAvax * 1000n
// const Schmeckle = MicroAvax * 49n + NanoAvax * 463n
const MilliAvax = MicroAvax * 1000n
export const Avax = MilliAvax * 1000n
const KiloAvax = Avax * 1000n
export const MegaAvax = KiloAvax * 1000n

export const Hour = 3600

type RewardConfig = {
  MaxConsumptionRate: number
  MinConsumptionRate: number
  //MintingPeriod in seconds
  MintingPeriod: number
  //SupplyCap in nAVAX
  SupplyCap: bigint
}
export type StakingConfig = {
  // Staking uptime requirements
  UptimeRequirement: number
  // Minimum stake, in nAVAX, required to validate the primary network
  MinValidatorStake: bigint
  // Maximum stake, in nAVAX, allowed to be placed on a single validator in
  // the primary network
  MaxValidatorStake: bigint
  // Minimum stake, in nAVAX, that can be delegated on the primary network
  MinDelegatorStake: bigint
  // Minimum delegation fee, in the range [0, 1000000], that can be charged
  // for delegation on the primary network.
  MinDelegationFee: bigint
  // MinStakeDuration is the minimum amount of time a validator can validate
  // for in a single period.
  MinStakeDuration: number
  // MaxStakeDuration is the maximum amount of time a validator can validate
  // for in a single period.
  MaxStakeDuration: bigint
  // RewardConfig is the config for the reward function.
  RewardConfig: RewardConfig
}

type TxFeeConfig = {
  // Transaction fee
  TxFee: bigint
  // Transaction fee for create asset transactions
  CreateAssetTxFee: bigint
  // Transaction fee for create subnet transactions
  CreateSubnetTxFee: bigint
  // Transaction fee for transform subnet transactions
  TransformSubnetTxFee: bigint
  // Transaction fee for create blockchain transactions
  CreateBlockchainTxFee: bigint
  // Transaction fee for adding a primary network validator
  AddPrimaryNetworkValidatorFee: bigint
  // Transaction fee for adding a primary network delegator
  AddPrimaryNetworkDelegatorFee: bigint
  // Transaction fee for adding a subnet validator
  AddSubnetValidatorFee: bigint
  // Transaction fee for adding a subnet delegator
  AddSubnetDelegatorFee: bigint
}

type Params = {
  stakingConfig: StakingConfig
  txFeeConfig: TxFeeConfig
}

export const MainnetParams = {
  txFeeConfig: {
    TxFee: MilliAvax,
    CreateAssetTxFee: MilliAvax * 10n,
    CreateSubnetTxFee: Avax,
    TransformSubnetTxFee: Avax * 10n,
    CreateBlockchainTxFee: Avax,
    AddPrimaryNetworkValidatorFee: 0n,
    AddPrimaryNetworkDelegatorFee: 0n,
    AddSubnetValidatorFee: MilliAvax,
    AddSubnetDelegatorFee: MilliAvax
  } as TxFeeConfig,
  stakingConfig: {
    UptimeRequirement: 0.8, // 80%
    MinValidatorStake: KiloAvax * 2n,
    MaxValidatorStake: MegaAvax * 3n,
    MinDelegatorStake: Avax * 25n,
    MinDelegationFee: 20000n, // 2%
    MinStakeDuration: 2 * 7 * 24 * Hour,
    MaxStakeDuration: 31536000n,
    RewardConfig: {
      MaxConsumptionRate: 0.12,
      MinConsumptionRate: 0.1,
      MintingPeriod: 365 * 24 * Hour,
      SupplyCap: MegaAvax * 720n
    } as RewardConfig
  } as StakingConfig
} as Params

// FujiParams are the params used for the fuji testnet
export const FujiParams = {
  txFeeConfig: {
    TxFee: MilliAvax,
    CreateAssetTxFee: MilliAvax * 10n,
    CreateSubnetTxFee: MilliAvax * 100n,
    TransformSubnetTxFee: Avax,
    CreateBlockchainTxFee: MilliAvax * 100n,
    AddPrimaryNetworkValidatorFee: 0n,
    AddPrimaryNetworkDelegatorFee: 0n,
    AddSubnetValidatorFee: MilliAvax,
    AddSubnetDelegatorFee: MilliAvax
  } as TxFeeConfig,
  stakingConfig: {
    UptimeRequirement: 0.8, // 80%
    MinValidatorStake: Avax,
    MaxValidatorStake: MegaAvax * 3n,
    MinDelegatorStake: Avax,
    MinDelegationFee: 20000n, // 2%
    MinStakeDuration: 24 * Hour,
    MaxStakeDuration: 31536000n,
    RewardConfig: {
      MaxConsumptionRate: 0.12,
      MinConsumptionRate: 0.1,
      MintingPeriod: 365 * 24 * Hour,
      SupplyCap: MegaAvax * 720n
    } as RewardConfig
  } as StakingConfig
} as Params
