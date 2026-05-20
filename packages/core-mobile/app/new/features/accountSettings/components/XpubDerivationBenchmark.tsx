import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import { runXpubDerivationBenchmark } from 'services/wallet/__bench__/xpubDerivationBenchmark'
import React, { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import Logger from 'utils/Logger'

/**
 * BENCH (cp14062-bench) — Compare the native `deriveAddressesFromXpubs`
 * (react-native-nitro-avalabs-crypto, batched) against the JS
 * `deriveAddressesFromXpub` looped per account (the fallback inside
 * `deriveAddressesBatch`). Lives at the root of Account Settings, just
 * below the other two derivation benchmarks.
 *
 * Wallet-independent — xpubs are derived from a fixed test mnemonic so
 * any signed-in user can run it.
 *
 * Result table goes into a native Alert; full JSON to console.log.
 *
 * Delete this file (and the import in accountSettings/index.tsx) before
 * merging back to cp14062.
 */
export const XpubDerivationBenchmark = (): React.JSX.Element => {
  const [running, setRunning] = useState(false)

  const onPress = useCallback(async (): Promise<void> => {
    setRunning(true)
    try {
      const result = await runXpubDerivationBenchmark({})
      const header = `N    A_cold  A_warm   B_cold  B_warm   B/A_c  B/A_w  A_c/w  B_c/w`
      const fmtMs = (v: number): string => v.toFixed(1).padStart(6)
      const fmtRatio = (v: number): string => `${v.toFixed(2)}x`
      const lines = result.matrix.map(
        m =>
          `${String(m.n).padStart(3)}  ` +
          `${fmtMs(m.aColdMs)}  ${fmtMs(m.aWarmMs)}   ` +
          `${fmtMs(m.bColdMs)}  ${fmtMs(m.bWarmMs)}   ` +
          `${fmtRatio(m.bVsACold)}  ${fmtRatio(m.bVsAWarm)}  ` +
          `${fmtRatio(m.aColdVsWarm)}  ${fmtRatio(m.bColdVsWarm)}`
      )
      Alert.alert(
        'Xpub derivation benchmark',
        [
          'A = native deriveAddressesFromXpubs (batched)',
          'B = JS deriveAddressesFromXpub (per-account loop)',
          '_cold = first timed sample (JIT cold)',
          '_warm = median of subsequent samples',
          'B/A = how many times slower JS is vs native at that cache state',
          'A_c/w, B_c/w = how much slower cold is vs warm for that scenario',
          `xpub generation: ${result.xpubGenMs.toFixed(0)} ms`,
          '',
          header,
          ...lines,
          '',
          'Full JSON in console.log.'
        ].join('\n')
      )
    } catch (err) {
      Logger.error('[XpubDerivationBenchmark] failed', err)
      Alert.alert(
        'Benchmark failed',
        err instanceof Error ? err.message : String(err)
      )
    } finally {
      setRunning(false)
    }
  }, [])

  const label = running
    ? 'Running xpub bench…'
    : 'Run xpub derivation benchmark'

  return (
    <TouchableOpacity
      sx={{
        alignItems: 'center',
        // Distinctive color so it's impossible to miss while debugging.
        // Different hue from the two bench buttons above so they're easy
        // to tell apart at a glance. Restyle / restore before merge.
        backgroundColor: '#7E3DFF',
        borderRadius: 12,
        padding: 14,
        opacity: running ? 0.5 : 1
      }}
      disabled={running}
      onPress={onPress}>
      <Text
        variant="body1"
        sx={{ color: '#FFFFFF', lineHeight: 20, fontWeight: '700' }}>
        🟣 {label}
      </Text>
    </TouchableOpacity>
  )
}
