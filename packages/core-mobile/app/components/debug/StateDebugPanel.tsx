import React from 'react'
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { StatePersistence } from 'utils/state/StatePersistence'
import Logger from 'utils/Logger'

export const StateDebugPanel = (): JSX.Element => {
  const handleSaveState = (): void => {
    StatePersistence.saveState().catch(Logger.error)
  }

  const handleLoadState = (): void => {
    StatePersistence.loadState().catch(Logger.error)
  }

  const handleProceedNormal = (): void => {
    StatePersistence.proceedNormal().catch(Logger.error)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleSaveState}>
        <Text style={styles.buttonText}>Save State</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLoadState}>
        <Text style={styles.buttonText}>Load State</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleProceedNormal}>
        <Text style={styles.buttonText}>Proceed</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 150,
    right: 0,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'black',
    opacity: 0.8,
    flexDirection: 'column',
    gap: 8,
    zIndex: 9999,
    elevation: 9999
  },
  button: {
    padding: 8,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  buttonText: {
    color: 'black'
  }
})
