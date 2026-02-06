import { BuildTxParams } from './services/ParaswapService'

/**
 * The address where ParaSwap will send collected partner fees.
 */
const PARASWAP_PARTNER_ADDRESS = '0xcEA3b9415F269B5686403909d781959570f32CF0'

/**
 * The fee percentage that Core gathers on ParaSwap swaps.
 *
 * An integer representing the basis points (BPS) of the fee percentage.
 *
 * @example 85 -> 0.85%
 */
export const PARASWAP_PARTNER_FEE_BPS = 85

/**
 * The fee percentage that Core gathers on Markr swaps.
 *
 * An integer representing the basis points (BPS) of the fee percentage.
 *
 * @example 85 -> 0.85%
 */
export const MARKR_PARTNER_FEE_BPS = 85 

/**
 * The address ParaSwap uses for EVM native tokens.
 */
export const EVM_NATIVE_TOKEN_ADDRESS =
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

/**
 * The address Markr uses for EVM native tokens.
 */
export const MARKR_EVM_NATIVE_TOKEN_ADDRESS =
  '0x0000000000000000000000000000000000000000'

/**
 * The partner ID Markr uses for EVM swaps.
 */
export const MARKR_EVM_PARTNER_ID =
  '0x655812b0b38b7733f8b36ec2bf870fd23be54cde979bcb722861de8ab6861fc4'

/**
 * The interval in milliseconds at which to refresh quotes.
 */
export const SWAP_REFRESH_INTERVAL = 30000

/**
 * The necessary parameters for Core to gather fees from the swap.
 */
export const PARTNER_FEE_PARAMS = {
  partnerAddress: PARASWAP_PARTNER_ADDRESS,
  partnerFeeBps: PARASWAP_PARTNER_FEE_BPS,
  isDirectFeeTransfer: true
  // TODO: upgrade prettier to latest version to fix this
  // eslint-disable-next-line prettier/prettier
} satisfies Partial<BuildTxParams>

/**
 * The address Jupiter uses for Solana native tokens.
 */
export const SOL_MINT = 'So11111111111111111111111111111111111111112'

/**
 * Solana base transaction fee per signature in lamports (0.000005 SOL)
 */
export const SOL_BASE_TX_FEE_PER_SIG = 5_000n

/**
 * Solana rent-exempt fee for an ATA (Associated Token Account) in lamports (~0.002 SOL)
 * This is required when creating a new token account
 */
export const SOL_BASE_RENT_FEE = 2_039_280n

/**
 * Fee buffer percentage for Jupiter swaps (1% of balance)
 * Fees can vary based on the number of routes used and complexity of the swap
 */
export const SOL_FEE_BUFFER_PERCENT = 0.01

/**
 * The address where Jupiter will send collected partner fees.
 */
export const JUPITER_PARTNER_ADDRESS =
  'CjKCcretczioDRkSSfu6qogF6aTkSeKMNVFB1UWXkR4U';

/**
 * The fee percentage that Core gathers on Jupiter swaps.
 * An integer representing the basis points (BPS) of the fee percentage.
 *
 * @example 85 -> 0.85%
 */
export const JUPITER_PARTNER_FEE_BPS = 85 as const satisfies number;


/**
 * Estimated gas limit for Paraswap swap transactions.
 * Based on core-web's DEFAULT_GAS_AMOUNT.
 */
export const PARASWAP_DEFAULT_GAS_LIMIT = 300_000

/**
 * Estimated gas limit for Markr swap transactions.
 * Based on core-web's MARKR_DEFAULT_GAS_AMOUNT.
 * Markr requires higher gas limit due to more complex routing.
 */
export const MARKR_DEFAULT_GAS_LIMIT = 750_000

export const WAVAX_ADDRESS = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
export const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

export const WRAPPABLE_TOKENS = [WAVAX_ADDRESS, WETH_ADDRESS]

/**
 * Minimum allowed slippage percentage for swaps.
 * @example 0.1 -> 0.1%
 */
export const MIN_SLIPPAGE_PERCENT = 0.1

/**
 * Maximum allowed slippage percentage for swaps.
 * @example 50 -> 50%
 */
export const MAX_SLIPPAGE_PERCENT = 50
