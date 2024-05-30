import React from 'react'

import SessionTimeout from 'seedless/screens/SessionTimeout'
import { noop } from 'lodash'

export default {
  title: 'Seedless/SessionTimeout'
}

export const SessionTimeoutScreen = (): JSX.Element => (
  <SessionTimeout onRetry={noop} />
)
