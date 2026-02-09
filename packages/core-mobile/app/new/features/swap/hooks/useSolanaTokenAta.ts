import { useQuery } from '@tanstack/react-query'
import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS
} from '@solana-program/token'
import { address } from '@solana/kit'
import { LocalTokenWithBalance } from 'store/balance'
import Logger from 'utils/Logger'

type UseSolanaTokenAtaParams = {
  addressSVM: string | undefined
  token: LocalTokenWithBalance | undefined
  provider: SolanaProvider | undefined
}

type SolanaTokenAtaResult = {
  exists: boolean
}

/**
 * In Solana, all SPL token balances require an Associated Token Account (ATA).
 * When a user receives a token for the first time, an ATA is created for them
 * using a combination of the token's mint address and the user's account address.
 * Additionally, that ATA must be 'rent-exempt' which means it must hold a minimum
 * SOL balance to remain active on the network.
 *
 * This hook checks for the existence of an ATA and returns the result.
 *
 * Based on core-web's useSolanaTokenAta hook.
 */
export const useSolanaTokenAta = ({
  addressSVM,
  token,
  provider
}: UseSolanaTokenAtaParams): {
  data: SolanaTokenAtaResult | undefined
  isLoading: boolean
} => {
  const mintAddress = token?.type === TokenType.SPL ? token.address : undefined

  const { data, isLoading } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['useSolanaTokenAta', addressSVM, mintAddress],
    queryFn: async (): Promise<SolanaTokenAtaResult> => {
      if (!mintAddress || !addressSVM || !provider) {
        return { exists: false }
      }

      try {
        const [ataAddress] = await findAssociatedTokenPda({
          mint: address(mintAddress),
          owner: address(addressSVM),
          tokenProgram: TOKEN_PROGRAM_ADDRESS
        })

        const accountInfo = await provider
          .getAccountInfo(ataAddress, { encoding: 'base64' })
          .send()

        return {
          exists: Boolean(accountInfo.value)
        }
      } catch (error) {
        Logger.error('Failed to check ATA existence', error)
        return { exists: false }
      }
    },
    enabled: Boolean(mintAddress && addressSVM && provider)
  })

  return { data, isLoading }
}
