import React from 'react'

import { StakeProgress } from 'screens/earn/components/StakeProgress'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/StakeProgress',
  decorators: [withCenterView]
}

export const Zero = () => <StakeProgress progress={0} />

export const FiftyTwo = () => <StakeProgress progress={52} />

export const OneHundred = () => <StakeProgress progress={100} />
