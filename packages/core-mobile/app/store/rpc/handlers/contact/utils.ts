import { Contact as SharedContact } from '@avalabs/types'
import { z } from 'zod'
import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { Contact } from 'store/addressBook'
import { Avalanche } from '@avalabs/wallets-sdk'

export const sharedContactSchema = z.object({
  name: z.string().min(1),
  address: z
    .string()
    .min(1)
    .refine(val => isAddress(val), {
      message: 'invalid EVM address'
    }),
  addressBTC: z
    .string()
    .optional()
    .refine(val => (val ? isBech32Address(val) : true), {
      message: 'invalid BTC address'
    }),
  addressPVM: z
    .string()
    .optional()
    .refine(val => (val ? Avalanche.isBech32Address(val, true) : true), {
      message: 'invalid PVM address'
    })
})

const hasIDSchema = z.object({ id: z.string().min(1) })

export const sharedContactWithIdSchema = sharedContactSchema.merge(hasIDSchema)

export const mapContactToSharedContact = (contact: Contact): SharedContact => ({
  id: contact.id,
  name: contact.title,
  address: contact.address,
  addressBTC: contact.addressBtc
})
