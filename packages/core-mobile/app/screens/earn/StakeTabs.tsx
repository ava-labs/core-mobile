import React from 'react'
import AvaText from 'components/AvaText'
import { TabView } from 'components/TabView'
import { ActiveStakes } from './components/ActiveStakes'
import { PastStakes } from './components/PastStakes'

const renderCustomLabel = ({
  children,
  color
}: {
  children: string
  color: string
}): React.JSX.Element => {
  return <AvaText.Subtitle1 textStyle={{ color }}>{children}</AvaText.Subtitle1>
}

const tabScreens = [
  { name: 'Active', component: ActiveStakes },
  { name: 'History', component: PastStakes }
]

export const StakeTabs = (): React.JSX.Element => (
  <TabView tabScreens={tabScreens} renderCustomLabel={renderCustomLabel} />
)
