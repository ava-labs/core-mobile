import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@k2-packages/k2-alpine'
import { Button, Text } from '@k2-packages/k2-alpine'
import ProfilingService from 'services/profiling/ProfilingService'
import { isDebugOrInternalBuild } from 'utils/Utils'

export const ProfilingModal = () => {
  const {
    theme: { colors }
  } = useTheme()
  const [filePath, setFilePath] = useState<string>()
  const isActive = ProfilingService.isSessionActive()
  const isDebugBuild = isDebugOrInternalBuild()

  const handleStartProfiling = async () => {
    await ProfilingService.startProfilingSession()
  }

  const handleStopProfiling = async () => {
    const path = await ProfilingService.stopProfilingSession()
    setFilePath(path)
  }

  if (isDebugBuild) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.$surfacePrimary }]}>
        <Text variant="heading6" style={{ color: colors.$textDanger }}>
          Profiling is only available in release builds
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.$surfacePrimary }]}>
      <Text
        variant="heading6"
        style={{ marginBottom: 16, color: colors.$textPrimary }}>
        Performance Profiling
      </Text>

      {!isActive ? (
        <Button type="primary" size="medium" onPress={handleStartProfiling}>
          Start Profiling
        </Button>
      ) : (
        <Button type="primary" size="medium" onPress={handleStopProfiling}>
          Stop Profiling
        </Button>
      )}

      {filePath && (
        <Text
          variant="body2"
          style={{ marginTop: 16, color: colors.$textSecondary }}>
          Profile saved to: {filePath}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16
  }
})
