export interface TokenSubscriptionItem {
  internalId: string // EIP-155 format: eip155:43114-0x<contract_address>
}

export interface TokenSubscriptionPayload {
  tokens: TokenSubscriptionItem[]
  deviceArn: string
}
