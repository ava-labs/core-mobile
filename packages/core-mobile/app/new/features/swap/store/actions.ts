import { createAction } from '@reduxjs/toolkit'
import type { Transfer } from '../types'

export const trackFusionTransfer = createAction<Transfer>(
  'fusion/trackTransfer'
)
