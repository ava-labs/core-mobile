import React from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import CoreOwlSVG from 'components/svg/CoreOwlSVG'
import { hideModal, showModal } from 'utils/modal'

const { height: screenHeight } = Dimensions.get('window')

const GlobalOwlLoader = (): JSX.Element => {
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        height: screenHeight,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black'
      }}>
      <CoreOwlSVG />
    </View>
  )
}

// use this to show a global owl modal (non-animated)
export const showOwl = (): void => {
  showModal(<GlobalOwlLoader />)
}

export const hideOwl = (): void => {
  hideModal()
}
