import React from 'react'

import { CircularProgress as CircularProgressBar } from 'screens/earn/components/CircularProgress'
import { StakeTypeEnum } from 'services/earn/types'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/CircularProgress',
  decorators: [withCenterView]
}

const stakingData = [
  {
    type: StakeTypeEnum.Available,
    amount: 100
  },
  { type: StakeTypeEnum.Staked, amount: 200 },
  { type: StakeTypeEnum.Claimable, amount: 300 }
]

export const CircularProgress = () => <CircularProgressBar data={stakingData} />
