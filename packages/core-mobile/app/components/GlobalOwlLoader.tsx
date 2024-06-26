import React from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import RootSiblingsManager from 'react-native-root-siblings'
import CoreOwlSVG from 'components/svg/CoreOwlSVG'
import Logger from 'utils/Logger'

const { height: screenHeight } = Dimensions.get('window')

let rootNode: RootSiblingsManager | null = null

const showModal = (element: JSX.Element): void => {
  // if there is already a modal shown, hide it first
  if (rootNode !== null) {
    Logger.warn(
      'duplicate owl modal',
      'there is already a modal shown, you should hide it first'
    )
    return
  }
  rootNode = new RootSiblingsManager(element)
}

const hideModal = (): void => {
  rootNode?.destroy()
  rootNode = null
}

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
