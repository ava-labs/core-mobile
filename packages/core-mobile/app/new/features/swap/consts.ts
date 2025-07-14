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
 * The address ParaSwap uses for EVM native tokens.
 */
export const EVM_NATIVE_TOKEN_ADDRESS =
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

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
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

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


export const WAVAX_ADDRESS = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
export const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

export const WRAPPABLE_TOKENS = [WAVAX_ADDRESS, WETH_ADDRESS]
