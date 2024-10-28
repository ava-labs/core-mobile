import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StakeStatus } from 'types/earn'

type Props = {
  status: StakeStatus
  testID?: string
}

export const StatusChip: React.FC<Props> = ({ status, testID }) => {
  const { theme } = useApplicationContext()

  const renderLabel = (label: string): JSX.Element => (
    <>
      <Space x={5} />
      <AvaText.ButtonMedium
        testID={testID}
        textStyle={{ lineHeight: 20, color: theme.neutralSuccessLight }}>
        {label}
      </AvaText.ButtonMedium>
    </>
  )

  const renderContent = (): JSX.Element => {
    if (status === StakeStatus.Completed)
      return (
        <>
          <CheckmarkSVG size={12} color={theme.neutralSuccessLight} />
          {renderLabel('Done')}
        </>
      )

    return (
      <>
        <View
          style={[styles.dot, { backgroundColor: theme.neutralSuccessLight }]}
        />
        {renderLabel('Active')}
      </>
    )
  }

  return (
    <Row style={[styles.container, { backgroundColor: theme.neutral850 }]}>
      {renderContent()}
    </Row>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  }
})
