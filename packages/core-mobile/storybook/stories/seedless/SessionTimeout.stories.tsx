import React from 'react'
import type { Meta } from '@storybook/react-native'
import SessionTimeout from 'seedless/screens/SessionTimeout'
import { noop } from 'lodash'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'Seedless/SessionTimeout',
  decorators: [withProviders]
} as Meta

export const SessionTimeoutScreen = (): JSX.Element => (
  <SessionTimeout onRetry={noop} />
)
