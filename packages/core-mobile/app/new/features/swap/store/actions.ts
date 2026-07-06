import { createAction } from '@reduxjs/toolkit'
import type { Quote, Transfer } from '../types'

export type TrackFusionTransferPayload = {
  transfer: Transfer
  quote: Quote
  userClickedMax: boolean
  sourceTokenAddress?: string
  sourceTokenSymbol?: string
  destinationTokenAddress?: string
  destinationTokenSymbol?: string
}

export const trackFusionTransfer = createAction<TrackFusionTransferPayload>(
  'fusion/trackTransfer'
)
