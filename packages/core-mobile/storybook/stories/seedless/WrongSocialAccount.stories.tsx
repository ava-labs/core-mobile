import React from 'react'

import { noop } from 'lodash'
import WrongSocialAccount from 'seedless/screens/WrongSocialAccount'

export default {
  title: 'Seedless/WrongSocialAccount'
}

export const WrongSocialAccountScreen = (): JSX.Element => (
  <WrongSocialAccount onRetry={noop} />
)
