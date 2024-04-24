import React from 'react'

import SessionTimeout from 'seedless/screens/SessionTimeout'
import { noop } from 'lodash'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'Seedless/SessionTimeout',
  decorators: [withProviders]
}

export const SessionTimeoutScreen = (): JSX.Element => (
  <SessionTimeout onRetry={noop} />
)
