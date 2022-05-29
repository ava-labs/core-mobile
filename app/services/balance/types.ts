export type TokenListDict = {
  [contract: string]: TokenListERC20
}

export type TokenListERC20 = {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}
