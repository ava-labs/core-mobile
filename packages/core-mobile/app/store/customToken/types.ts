import { NetworkContractToken } from '@avalabs/vm-module-types'

export const initialState: CustomTokenState = {
  tokens: {}
}

export type CustomTokenState = {
  tokens: { [chainId: string]: NetworkContractToken[] }
}
