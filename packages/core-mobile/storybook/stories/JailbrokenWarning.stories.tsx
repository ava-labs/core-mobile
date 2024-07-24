import React from 'react'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { noop } from '@avalabs/utils-sdk'

export default {
  title: 'JailbrokenWarning'
}

export const Default = () => <JailbrokenWarning onOK={noop} />
