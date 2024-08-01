import React from 'react'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { noop } from '@avalabs/core-utils-sdk'

export default {
  title: 'JailbrokenWarning'
}

export const Default = (): React.JSX.Element => (
  <JailbrokenWarning onOK={noop} />
)
