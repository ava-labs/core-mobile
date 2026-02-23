import { MarketName, MarketNames } from './types'

// Display names for protocol markets
export const PROTOCOL_DISPLAY_NAMES: Record<MarketName, string> = {
  [MarketNames.aave]: 'Aave',
  [MarketNames.benqi]: 'Benqi'
}

// RAY (ray of precision) is used to format values stored throughout DeFi contracts such as interest rates
export const RAY = 27
// Scale for BENQI supply rates
export const WAD = 18
// Scale for AAVE Price Oracle rates
export const AAVE_PRICE_ORACLE_SCALE = 8

// formatted reward values must exceed this amount to be shown to the user.
export const REWARD_DISPLAY_THRESHOLD = 0.0000000001

// Addresses from https://github.com/bgd-labs/aave-address-book/blob/main/src/AaveV3Avalanche.sol
export const AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS =
  '0x50B4a66bF4D41e6252540eA7427D7A933Bc3c088' as const
export const AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS =
  '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb' as const
export const AAVE_POOL_C_CHAIN_ADDRESS =
  '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const
export const AAVE_UI_INCENTIVES_DATA_PROVIDER_C_CHAIN_ADDRESS =
  '0x99732D5dA21f44f9e45e36eF9da4B1df2Eb0b28E' as const
export const AAVE_WRAPPED_AVAX_GATEWAY_ADDRESS =
  '0x2825cE5921538d17cc15Ae00a8B24fF759C6CDaE' as const
export const AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS =
  '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' as const
export const AAVE_STAKED_AVAX_C_CHAIN_ADDRESS =
  '0x513c7E3a9c69cA3e22550eF58AC1C0088e918FFf' as const
export const AAVE_PRICE_ORACLE_C_CHAIN_ADDRESS =
  '0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C' as const
export const AAVE_TOKEN_C_CHAIN_ADDRESS =
  '0x63a72806098Bd3D9520cC43356dD78afe5D386D9' as const
export const AAVE_AWAVAX_C_CHAIN_ADDRESS =
  '0x6d80113e533a2c0fe82eabd35f1875dcea89ea97' as const

export const MERKL_DISTRIBUTOR_ADDRESS =
  '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const

export const A_TOKEN_DECIMALS = 8
export const WRAPPED_AVAX_DECIMALS = 18

export const BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS =
  '0x316ae55ec59e0beb2121c0e41d4bdef8bf66b32b' as const
export const BENQI_QAVAX_C_CHAIN_ADDRESS =
  '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c' as const
export const BENQI_QI_C_CHAIN_ADDRESS =
  '0x35Bd6aedA81a7E5FC7A7832490e71F757b0cD9Ce' as const
export const BENQI_LENS_C_CHAIN_ADDRESS =
  '0x15f30De066D21e4828D78A497d31c665a6162D2D' as const
export const BENQI_COMPTROLLER_C_CHAIN_ADDRESS =
  '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4' as const
export const BENQI_QI_TOKEN_DECIMALS = 8

// Benqi reward types for claimReward function
export const BENQI_TOKEN_TYPE_QI = 0
export const BENQI_TOKEN_TYPE_AVAX = 1

// Gas costs for minting with some buffer
// https://snowtrace.io/tx/0x6d76d6232ccbe4d9450d6d3ce913cefb5257be6ee62b6385d2b371da0d3122fe?chainid=43114
// https://snowtrace.io/tx/0xe4265750b3c4c4b720fb45fb88a7567c3e5044bebfae3b9415eacfe771a39c4b?chainid=43114
// https://snowtrace.io/tx/0x452ec2c570ec4dc6a6fe776366316c5bd1e763b8fdb639491ffe0b9e572f7cb4?chainid=43114
export const MINT_GAS_AMOUNT = 210_000

// Gas costs for approving with some buffer
// https://snowtrace.io/tx/0xa79963b5b63e2a2ccb7c8e7131505588b116c2cd8f8a57792214777daebf7272?chainid=43114
// https://snowtrace.io/tx/0xa07728e0bb5f9faad28af6fddab283c191dc0e3a4a5edba0a36060d069642d54?chainid=43114
// https://snowtrace.io/tx/0xe6a4ca5335cf3f59f3467128d6afaabd5c3258cd23e04a7bcfe996126d60531d?chainid=43114
export const APPROVE_GAS_AMOUNT = 60_000

// Gas costs for calling depositETH with some buffer
// https://snowtrace.io/tx/0x65f0384d8a8a48c791ad661d0cecbf40bde0e901f60f37d74518c35d6b18c600?chainid=43114
// https://snowtrace.io/tx/0x15145ac8601065c771df33a8dbf239b27a4e0f736dc0826ee229ec46dccab5a2?chainid=43114
// https://snowtrace.io/tx/0x4454791ad6d1f3b1b276bd77a0847eabc6e5fe9ae8f7c6c79a3639e38b6159bc?chainid=43114
export const DEPOSIT_ETH_GAS_AMOUNT = 200_000

// Aave v3 GraphQL
export const AAVE_V3_GQL_API_URL = 'https://api.v3.aave.com/graphql'

// Aave Chan Initiative Merit API
export const AAVE_CHAN_MERIT_API_URL = 'https://apps.aavechan.com/api/merit'

// Merkl API for Aave rewards
export const MERKL_API_URL = 'https://api.merkl.xyz/v4'
export const MERKL_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

export const MAX_UINT256 = 2n ** 256n - 1n

// Health score color for caution state (1.1 - 3.0)
export const HEALTH_SCORE_CAUTION_COLOR = '#F7B500'
