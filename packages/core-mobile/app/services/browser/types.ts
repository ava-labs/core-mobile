import { zodToCamelCase } from 'utils/zodToCamelCase'
import z from 'zod'
import { DeFiProtocolInformationSchema } from './debankTypes'

export const DeFiProtocolInformationCamelCase = zodToCamelCase(
  DeFiProtocolInformationSchema
)
export type DeFiProtocolInformation = z.infer<
  typeof DeFiProtocolInformationCamelCase
>
