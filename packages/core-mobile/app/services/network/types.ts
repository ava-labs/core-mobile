import { Hex } from '@avalabs/vm-module-types'

export type DebankNetwork = {
  community_id: number
  id: string
  is_support_pre_exec: boolean
  logo_url: string
  name: string
  native_token_id: string
  wrapped_token_id: Hex
}
