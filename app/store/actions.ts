import { createAction } from '@reduxjs/toolkit'

// app lifecycle actions

// when app rehydration is complete
const lifeCycleKey = 'lifecycle'

export const onRehydrationComplete = createAction(
  `${lifeCycleKey}/onRehydrationComplete`
)

// when user has successfully entered pin or biometrics to unlock the app
export const onLoginSuccess = createAction(`${lifeCycleKey}/onLoginSuccess`)
