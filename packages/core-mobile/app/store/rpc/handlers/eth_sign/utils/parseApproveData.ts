import { z } from 'zod'
import { accountSchema } from '../../account/avalanche_selectAccount/utils'
import { networkSchema } from '../../chain/utils'
import { combinedDataSchema } from '../schemas/ethSignTypedData'

const approveDataSchema = z.object({
  data: combinedDataSchema,
  network: networkSchema,
  account: accountSchema
})

export function parseApproveData(data: unknown) {
  return approveDataSchema.safeParse(data)
}
