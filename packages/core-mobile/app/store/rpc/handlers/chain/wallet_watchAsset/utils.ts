import { z } from 'zod'
import { TokenType } from '@avalabs/vm-module-types'
import { isAddress } from 'ethers'

// Accepts a non-negative integer (0-255) as either a number or a string of digits.
// Rejects '', ' ', '1.5', 'abc', etc. that Number() would silently coerce.
const decimalsSchema = z.union([
  z.number().int().min(0).max(255),
  z
    .string()
    .regex(/^\d+$/)
    .refine(s => Number(s) <= 255, {
      message: 'Decimals must be between 0 and 255'
    })
    .transform(Number)
])

const erc20OptionsSchema = z.object({
  address: z.string().refine(isAddress, { message: 'Invalid EVM address' }),
  symbol: z.string(),
  decimals: decimalsSchema,
  image: z.string().optional().catch(undefined)
})

const erc20ParamSchema = z.object({
  type: z.literal('ERC20'),
  options: erc20OptionsSchema
})

const approveDataSchema = z.object({
  token: z.object({
    type: z.literal(TokenType.ERC20),
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUri: z.string()
  })
})

// EIP-747 params can be array [{ type, options }] or object { type, options }
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseRequestParams = (params: unknown) => {
  const raw = Array.isArray(params) ? params[0] : params
  return erc20ParamSchema.safeParse(raw)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const parseApproveData = (data: unknown) => {
  return approveDataSchema.safeParse(data)
}
