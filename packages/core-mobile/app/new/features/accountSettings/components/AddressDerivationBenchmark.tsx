import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import { runAddressDerivationBenchmark } from 'services/wallet/__bench__/addressDerivationBenchmark'
import { WalletType } from 'services/wallet/types'
import React, { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveWallet } from 'store/wallet/slice'
import Logger from 'utils/Logger'

/**
 * BENCH (cp14062-bench) — Run the address-derivation benchmark for the
 * active wallet. Lives at the root of Account Settings, just under the
 * "Delete wallet" button. Visually styled to match the Lock/Delete buttons.
 *
 * Mnemonic and private-key wallets only — Ledger / Keystone / Seedless
 * would block scenario A on the device. The button is rendered but
 * disabled for those.
 *
 * Result table goes into a native Alert; full JSON to console.log.
 *
 * Delete this file (and the import in accountSettings/index.tsx) before
 * merging back to cp14062.
 */
export const AddressDerivationBenchmark = (): React.JSX.Element => {
  const activeWallet = useSelector(selectActiveWallet)
  const [running, setRunning] = useState(false)

  const supported =
    activeWallet?.type === WalletType.MNEMONIC ||
    activeWallet?.type === WalletType.PRIVATE_KEY

  const onPress = useCallback(async (): Promise<void> => {
    if (!activeWallet) return
    setRunning(true)
    try {
      const result = await runAddressDerivationBenchmark({
        walletId: activeWallet.id,
        walletType: activeWallet.type
      })
      const header = `N    A(ms)   B(ms)   C(ms)   E(ms)   B/A    C/A    E/A`
      const fmtMs = (v: number): string => v.toFixed(1).padStart(6)
      const fmtRatio = (v: number): string => `${v.toFixed(2)}x`
      const lines = result.matrix.map(
        m =>
          `${String(m.n).padStart(3)}  ` +
          `${fmtMs(m.aMedianMs)}  ` +
          `${fmtMs(m.bMedianMs)}  ` +
          `${fmtMs(m.cMedianMs)}  ` +
          `${fmtMs(m.eMedianMs)}  ` +
          `${fmtRatio(m.bVsA)}  ` +
          `${fmtRatio(m.cVsA)}  ` +
          `${fmtRatio(m.eVsA)}`
      )
      Alert.alert(
        'Address derivation benchmark',
        [
          `prefetch: ${result.pubkeyPrefetchMs.toFixed(0)} ms`,
          '',
          header,
          ...lines,
          '',
          'Full JSON in console.log.'
        ].join('\n')
      )
    } catch (err) {
      Logger.error('[AddressDerivationBenchmark] failed', err)
      Alert.alert(
        'Benchmark failed',
        err instanceof Error ? err.message : String(err)
      )
    } finally {
      setRunning(false)
    }
  }, [activeWallet])

  const label = !supported
    ? 'Run benchmark (mnemonic/private-key only)'
    : running
    ? 'Running benchmark…'
    : 'Run address derivation benchmark'

  return (
    <TouchableOpacity
      sx={{
        alignItems: 'center',
        // Distinctive color so it's impossible to miss while debugging.
        // Restyle / restore to $surfaceSecondary before merge.
        backgroundColor: '#FF6A3D',
        borderRadius: 12,
        padding: 14,
        opacity: !supported || running ? 0.5 : 1
      }}
      disabled={!supported || running}
      onPress={onPress}>
      <Text
        variant="body1"
        sx={{ color: '#FFFFFF', lineHeight: 20, fontWeight: '700' }}>
        🟠 {label}
      </Text>
    </TouchableOpacity>
  )
}
