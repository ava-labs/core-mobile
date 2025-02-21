import React from 'react'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import { ActiveStakes } from './components/ActiveStakes'
import { PastStakes } from './components/PastStakes'

const renderLabel = (
  title: string,
  selected: boolean,
  color: string
): JSX.Element => {
  return <AvaText.Subtitle1 textStyle={{ color }}>{title}</AvaText.Subtitle1>
}

export const StakeTabs = (): JSX.Element => {
  return (
    <TabViewAva renderLabel={renderLabel}>
      <TabViewAva.Item title={'Active'}>
        <ActiveStakes />
      </TabViewAva.Item>
      <TabViewAva.Item title={'History'}>
        <PastStakes />
      </TabViewAva.Item>
    </TabViewAva>
  )
}
