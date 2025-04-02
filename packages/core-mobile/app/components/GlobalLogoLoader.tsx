import React from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { hideModal, showModal } from 'utils/modal'
import CoreLogo from '../assets/icons/core.svg'

const { height: screenHeight } = Dimensions.get('window')

const GlobalLogoLoader = (): JSX.Element => {
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        height: screenHeight,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black'
      }}>
      <CoreLogo />
    </View>
  )
}

// use this to show a global logo modal (non-animated)
export const showLogo = (): void => {
  showModal(<GlobalLogoLoader />)
}

export const hideLogo = (): void => {
  hideModal()
}
