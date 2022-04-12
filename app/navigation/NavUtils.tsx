import {StackNavigationOptions} from '@react-navigation/stack'
import AvaText from 'components/AvaText'
import React from 'react'
import {Row} from 'components/Row'

export const MainHeaderOptions = (
  title: string,
  hideHeaderLeft = false,
  actionComponent?: React.ReactNode
): Partial<StackNavigationOptions> => {
  return {
    headerShown: true,
    headerTitle: () => {
      return (
        <Row
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <AvaText.Heading1>{title}</AvaText.Heading1>
          {actionComponent}
        </Row>
      )
    },
    headerTitleAlign: 'left',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
    headerStyle: {
      shadowColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0
    }
  }
}

export const SubHeaderOptions = (
  title: string,
  hideHeaderLeft = false
): Partial<StackNavigationOptions> => {
  const options: Partial<StackNavigationOptions> = {
    headerShown: true,
    headerTitle: () => <AvaText.Heading2>{title}</AvaText.Heading2>,
    headerTitleAlign: 'center',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
    headerStyle: {
      shadowColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0
    }
  }

  return options
}
