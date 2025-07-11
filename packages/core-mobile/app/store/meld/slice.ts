import { createAction } from '@reduxjs/toolkit'

const reducerName = 'meld'

// actions
export const offrampSend = createAction<{ searchParams: URLSearchParams }>(
  `${reducerName}/offrampSend`
)
