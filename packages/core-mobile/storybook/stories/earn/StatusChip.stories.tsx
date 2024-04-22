import React from 'react'

import { StatusChip } from 'screens/earn/components/StatusChip'
import { StakeStatus } from 'types/earn'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/StatusChip',
  decorators: [withCenterView]
}

export const Done = () => <StatusChip status={StakeStatus.Completed} />

export const Active = () => <StatusChip status={StakeStatus.Ongoing} />
