import React from 'react'
import type { Meta } from '@storybook/react-native'
import { noop } from 'lodash'
import WrongSocialAccount from 'seedless/screens/WrongSocialAccount'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'Seedless/WrongSocialAccount',
  decorators: [withProviders]
} as Meta

export const WrongSocialAccountScreen = (): JSX.Element => (
  <WrongSocialAccount onRetry={noop} />
)
