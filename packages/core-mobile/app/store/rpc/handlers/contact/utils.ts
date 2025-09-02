import { z } from 'zod'
import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/core-bridge-sdk'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { isAddress as isSolanaAddress } from '@solana/kit'

export const sharedContactSchema = z.object({
  name: z.string().min(1),
  address: z
    .string()
    .optional()
    .refine(val => (val ? isAddress(val) : true), {
      message: 'invalid EVM address'
    }),
  addressBTC: z
    .string()
    .optional()
    .refine(val => (val ? isBech32Address(val) : true), {
      message: 'invalid BTC address'
    }),
  addressXP: z
    .string()
    .optional()
    .refine(val => (val ? Avalanche.isBech32Address(val, false) : true), {
      message: 'invalid X/P address'
    }),
  addressSVM: z
    .string()
    .optional()
    .refine(val => (val ? isSolanaAddress(val) : true), {
      message: 'invalid Solana address'
    })
})

const hasIDSchema = z.object({ id: z.string().min(1) })

export const sharedContactWithIdSchema = sharedContactSchema.merge(hasIDSchema)
