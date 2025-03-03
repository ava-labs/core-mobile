import React from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { ActivityIndicator } from 'components/ActivityIndicator'
import AvaButton from 'components/AvaButton'

const WINDOW_WIDTH = Dimensions.get('window').width

export enum OverlayType {
  INSTRUCTION = 'INSTRUCTION',
  LOADING = 'LOADING',
  NO_DATA = 'NO_DATA'
}

type Props = {
  type: OverlayType | undefined
  onInstructionRead: () => void
}

export const Overlay = ({
  type,
  onInstructionRead
}: Props): React.JSX.Element | null => {
  let content
  if (type === OverlayType.LOADING) {
    // chart data is loading
    content = <ActivityIndicator />
  } else if (type === OverlayType.NO_DATA) {
    // chart data is empty, could not be retrieved
    content = (
      <>
        <AvaText.Heading5>No Chart Data Available</AvaText.Heading5>
        <AvaText.Body2 textStyle={styles.noChartDataText}>
          We are unable to retrieve chart data for this token. Please check back
          later.
        </AvaText.Body2>
      </>
    )
  } else if (type === OverlayType.INSTRUCTION) {
    // if we have data, and it's 1st time user seeing it, show instruction
    content = (
      <>
        <AvaText.Heading5>Hold and Drag</AvaText.Heading5>
        <AvaText.Body2 textStyle={styles.instructionText}>
          Hold and drag over chart for precise price and date
        </AvaText.Body2>
        <AvaButton.PrimaryLarge
          style={styles.gotItBtn}
          onPress={onInstructionRead}>
          Got it
        </AvaButton.PrimaryLarge>
      </>
    )
  }

  if (content) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>{content}</View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  noChartDataText: {
    width: '70%',
    textAlign: 'center',
    marginTop: 10
  },
  instructionText: {
    width: '50%',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  gotItBtn: { width: WINDOW_WIDTH - 32 },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000080'
  }
})
