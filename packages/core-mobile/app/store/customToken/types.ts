import { NetworkContractToken } from '@avalabs/chains-sdk'

export const initialState: CustomTokenState = {
  tokens: {}
}

export type CustomTokenState = {
  tokens: { [chainId: string]: NetworkContractToken[] }
}
