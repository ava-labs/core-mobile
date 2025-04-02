export type PriceChange = {
  formattedPrice: string
  status: PriceChangeStatus
  formattedPercent?: string
}

export enum PriceChangeStatus {
  Up = 'up',
  Down = 'down',
  Neutral = 'neutral'
}
