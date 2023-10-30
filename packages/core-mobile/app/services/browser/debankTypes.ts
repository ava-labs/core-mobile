import z, { boolean, number, object, string } from 'zod'

export const DeFiProtocolInformationSchema = object({
  id: string(),
  chain: string(),
  name: string().nullable(),
  site_url: string()
    .nullable()
    .transform(v => v ?? undefined),
  logo_url: string()
    .nullable()
    .transform(v => v ?? undefined),
  has_supported_portfolio: boolean(),
  tvl: number()
})
export type DeFiProtocolInformationObject = z.infer<
  typeof DeFiProtocolInformationSchema
>
