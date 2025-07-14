import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import { JUPITER_PARTNER_ADDRESS, SOL_MINT } from 'features/swap/consts'
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS
} from '@solana-program/token'
import { Address, address } from '@solana/kit'
import { JupiterQuote } from './schemas'

export const getJupiterFeeAccount = async ({
  isSwapFeesJupiterBlocked,
  quote,
  provider,
  onFeeAccountNotInitialized
}: {
  isSwapFeesJupiterBlocked: boolean
  quote: JupiterQuote
  provider: SolanaProvider
  onFeeAccountNotInitialized: (mint: string) => void
}): Promise<string | undefined> => {
  if (isSwapFeesJupiterBlocked) {
    return
  }

  // The `mints` array will hold token mints in which it would be possible for us to collect the fees,
  // with the preferred tokens being at the beginning of the array.
  let mints: [string] | [string, string] | undefined
  /**
   * The fees are always collected either the input or output token
   * (e.g. we can't choose SOL if user is swapping USDC -> JUP).
   */
  if (quote.swapMode === 'ExactIn') {
    /*
     * With `swapMode` being "ExactOut", we can choose which of the tokens to use for fees.
     * SOL is always preferred, so we check if it's a part of the swap and if it is,
     * we try to collect fees on that token.
     */
    if (quote.outputMint === SOL_MINT) {
      mints = [SOL_MINT, quote.inputMint]
    } else if (quote.inputMint === SOL_MINT) {
      mints = [SOL_MINT, quote.outputMint]
    } else {
      mints = [quote.inputMint, quote.outputMint]
    }
  } else if (quote.swapMode === 'ExactOut') {
    // With `swapMode` being "ExactOut", we can only collect fees on the input token.
    mints = [quote.inputMint]
  }

  if (!mints) {
    return
  }

  const [primaryFeeToken, secondaryFeeToken] = mints

  const { feeAccount, isInitialized } = await getFeeAccountInfo(
    provider,
    primaryFeeToken
  )

  if (isInitialized) {
    return feeAccount
  } else {
    // Capture the primary fee account not being initialized.
    onFeeAccountNotInitialized(primaryFeeToken)
  }

  // If we can't collect fees on the other token either, return early.
  if (!secondaryFeeToken) {
    return
  }

  // If we can use the other token to collect fees, let's try that:
  const {
    feeAccount: secondaryFeeAccount,
    isInitialized: isSecondaryFeeAccountInitialized
  } = await getFeeAccountInfo(provider, secondaryFeeToken)

  if (isSecondaryFeeAccountInitialized) {
    return secondaryFeeAccount
  }

  // Capture the secondary fee account not being initialized either.
  onFeeAccountNotInitialized(secondaryFeeToken)
}

export const getFeeAccountInfo = async (
  provider: SolanaProvider,
  feeAccountAddress: string
): Promise<{
  feeAccount: Address<string>
  isInitialized: boolean
}> => {
  const [feeAccount] = await findAssociatedTokenPda({
    mint: address(feeAccountAddress),
    owner: address(JUPITER_PARTNER_ADDRESS),
    tokenProgram: TOKEN_PROGRAM_ADDRESS
  })

  const feeAccountInfo = await provider
    .getAccountInfo(feeAccount, { encoding: 'base64' })
    .send()

  return {
    feeAccount,
    isInitialized: Boolean(feeAccountInfo.value)
  }
}
