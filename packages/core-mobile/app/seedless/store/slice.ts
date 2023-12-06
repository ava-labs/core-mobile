import { createAction } from '@reduxjs/toolkit'

export const reducerName = 'seedless'

export const onTokenExpired = createAction(`${reducerName}/onTokenExpired`)

export const reInitWalletIfNeeded = createAction(
  `${reducerName}/reInitWalletIfNeeded`
)
