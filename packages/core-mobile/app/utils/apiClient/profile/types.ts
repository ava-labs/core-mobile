import { z } from 'zod'
import { schemas } from '../generated/profileApi.client'

export type GetAddressesResponse = z.infer<typeof schemas.GetAddressesResponse>
