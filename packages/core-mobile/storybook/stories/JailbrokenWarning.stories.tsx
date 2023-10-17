import React from 'react'
import type { Meta } from '@storybook/react-native'
import JailbrokenWarning from 'screens/onboarding/JailbrokenWarning'
import { noop } from '@avalabs/utils-sdk'

export default {
  title: 'JailbrokenWarning'
} as Meta

export const Default = () => <JailbrokenWarning onOK={noop} />
