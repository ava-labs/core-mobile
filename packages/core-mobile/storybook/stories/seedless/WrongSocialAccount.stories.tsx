import React from 'react'

import { noop } from 'lodash'
import WrongSocialAccount from 'seedless/screens/WrongSocialAccount'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'Seedless/WrongSocialAccount',
  decorators: [withProviders]
}

export const WrongSocialAccountScreen = (): JSX.Element => (
  <WrongSocialAccount onRetry={noop} />
)
