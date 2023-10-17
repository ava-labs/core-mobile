import React from 'react'
import type { Meta } from '@storybook/react-native'
import { StatusChip } from 'screens/earn/components/StatusChip'
import { StakeStatus } from 'types/earn'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/StatusChip',
  decorators: [withCenterView]
} as Meta

export const Done = () => <StatusChip status={StakeStatus.Completed} />

export const Active = () => <StatusChip status={StakeStatus.Ongoing} />
