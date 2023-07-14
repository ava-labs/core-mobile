import BN from 'bn.js'

//TODO: convert to bigint
const NanoAvax = new BN(1) // 1_000_000_000 (9)
const MicroAvax = NanoAvax.muln(1000) // 1_000_000_000_000 (12)
// const Schmeckle = MicroAvax.muln(49).add(NanoAvax.muln(463))
const MilliAvax = MicroAvax.muln(1000) // 1_000_000_000_000_000 (15)
export const Avax = MilliAvax.muln(1000) // 1_000_000_000_000_000_000 (18)
const KiloAvax = Avax.muln(1000) // 1_000_000_000_000_000_000_000 (21)
export const MegaAvax = KiloAvax.muln(1000) // 1_000_000_000_000_000_000_000_000 (24)

export const NANO_AVAX_DENOMINATION = 9
export const MICRO_AVAX_DENOMINATION = 12
export const MILLI_AVAX_DENOMINATION = 15
export const AVAX_DENOMINATION = 18
export const KILO_AVAX_DENOMINATION = 21
export const MEGA_AVAX_DENOMINATION = 24

export const Hour = 3600

type RewardConfig = {
  MaxConsumptionRate: number
  MinConsumptionRate: number
  //MintingPeriod in seconds
  MintingPeriod: number
  //SupplyCap in nAVAX
  SupplyCap: BN
}
type StakingConfig = {
  // Staking uptime requirements
  UptimeRequirement: number
  // Minimum stake, in nAVAX, required to validate the primary network
  MinValidatorStake: BN
  // Maximum stake, in nAVAX, allowed to be placed on a single validator in
  // the primary network
  MaxValidatorStake: BN
  // Minimum stake, in nAVAX, that can be delegated on the primary network
  MinDelegatorStake: BN
  // Minimum delegation fee, in the range [0, 1000000], that can be charged
  // for delegation on the primary network.
  MinDelegationFee: BN
  // MinStakeDuration is the minimum amount of time a validator can validate
  // for in a single period.
  MinStakeDuration: number
  // MaxStakeDuration is the maximum amount of time a validator can validate
  // for in a single period.
  MaxStakeDuration: BN
  // RewardConfig is the config for the reward function.
  RewardConfig: RewardConfig
}

type TxFeeConfig = {
  // Transaction fee
  TxFee: BN
  // Transaction fee for create asset transactions
  CreateAssetTxFee: BN
  // Transaction fee for create subnet transactions
  CreateSubnetTxFee: BN
  // Transaction fee for transform subnet transactions
  TransformSubnetTxFee: BN
  // Transaction fee for create blockchain transactions
  CreateBlockchainTxFee: BN
  // Transaction fee for adding a primary network validator
  AddPrimaryNetworkValidatorFee: BN
  // Transaction fee for adding a primary network delegator
  AddPrimaryNetworkDelegatorFee: BN
  // Transaction fee for adding a subnet validator
  AddSubnetValidatorFee: BN
  // Transaction fee for adding a subnet delegator
  AddSubnetDelegatorFee: BN
}

type Params = {
  stakingConfig: StakingConfig
  txFeeConfig: TxFeeConfig
}

export const MainnetParams = {
  txFeeConfig: {
    TxFee: MilliAvax,
    CreateAssetTxFee: MilliAvax.muln(10),
    CreateSubnetTxFee: Avax.muln(1),
    TransformSubnetTxFee: Avax.muln(10),
    CreateBlockchainTxFee: Avax,
    AddPrimaryNetworkValidatorFee: new BN(0),
    AddPrimaryNetworkDelegatorFee: new BN(0),
    AddSubnetValidatorFee: MilliAvax,
    AddSubnetDelegatorFee: MilliAvax
  } as TxFeeConfig,
  stakingConfig: {
    UptimeRequirement: 0.8, // 80%
    MinValidatorStake: KiloAvax.muln(2),
    MaxValidatorStake: MegaAvax.muln(3),
    MinDelegatorStake: Avax.muln(25),
    MinDelegationFee: new BN(20000), // 2%
    MinStakeDuration: 2 * 7 * 24 * Hour,
    MaxStakeDuration: new BN(31536000),
    RewardConfig: {
      MaxConsumptionRate: 0.12,
      MinConsumptionRate: 0.1,
      MintingPeriod: 365 * 24 * Hour,
      SupplyCap: MegaAvax.muln(720)
    } as RewardConfig
  } as StakingConfig
} as Params

// FujiParams are the params used for the fuji testnet
export const FujiParams = {
  txFeeConfig: {
    TxFee: MilliAvax,
    CreateAssetTxFee: MilliAvax.muln(10),
    CreateSubnetTxFee: MilliAvax.muln(100),
    TransformSubnetTxFee: Avax,
    CreateBlockchainTxFee: MilliAvax.muln(100),
    AddPrimaryNetworkValidatorFee: new BN(0),
    AddPrimaryNetworkDelegatorFee: new BN(0),
    AddSubnetValidatorFee: MilliAvax,
    AddSubnetDelegatorFee: MilliAvax
  } as TxFeeConfig,
  stakingConfig: {
    UptimeRequirement: 0.8, // 80%
    MinValidatorStake: Avax,
    MaxValidatorStake: MegaAvax.muln(3),
    MinDelegatorStake: Avax,
    MinDelegationFee: new BN(20000), // 2%
    MinStakeDuration: 24 * Hour,
    MaxStakeDuration: new BN(31536000),
    RewardConfig: {
      MaxConsumptionRate: 0.12,
      MinConsumptionRate: 0.1,
      MintingPeriod: 365 * 24 * Hour,
      SupplyCap: MegaAvax.muln(720)
    } as RewardConfig
  } as StakingConfig
} as Params
