import { createAction } from '@reduxjs/toolkit'

export const reducerName = 'seedless'

export const onTokenExpired = createAction(`${reducerName}/onTokenExpired`)
