import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import { runModuleManagerDeriveBenchmark } from 'services/wallet/__bench__/moduleManagerDeriveBenchmark'
import { WalletType } from 'services/wallet/types'
import React, { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveWallet } from 'store/wallet/slice'
import Logger from 'utils/Logger'

/**
 * BENCH (cp14062-bench) — Compare ModuleManager.deriveAddresses (legacy
 * per-account, N sequential calls) against ModuleManager.deriveAllAddresses
 * (the new batched API). Lives at the root of Account Settings, just below
 * the per-chain address-derivation benchmark.
 *
 * Mnemonic and private-key wallets only — deriveAddresses goes through the
 * vm-modules, which block on the device for Ledger / Keystone / Seedless.
 *
 * Result table goes into a native Alert; full JSON to console.log.
 *
 * Delete this file (and the import in accountSettings/index.tsx) before
 * merging back to cp14062.
 */
export const ModuleManagerDeriveBenchmark = (): React.JSX.Element => {
  const activeWallet = useSelector(selectActiveWallet)
  const [running, setRunning] = useState(false)

  const supported =
    activeWallet?.type === WalletType.MNEMONIC ||
    activeWallet?.type === WalletType.PRIVATE_KEY

  const onPress = useCallback(async (): Promise<void> => {
    if (!activeWallet) return
    setRunning(true)
    try {
      const result = await runModuleManagerDeriveBenchmark({
        walletId: activeWallet.id,
        walletType: activeWallet.type
      })
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
        'ModuleManager derive benchmark',
        [
          'A = deriveAddresses (per-account × N)',
          'B = deriveAllAddresses (batched)',
          '_cold = pubkey cache cleared before run',
          '_warm = run immediately after the matching cold run',
          'B/A = how much faster B is vs A at that cache state',
          'A_c/w, B_c/w = how much slower cold is vs warm',
          '',
          header,
          ...lines,
          '',
          'Full JSON in console.log.'
        ].join('\n')
      )
    } catch (err) {
      Logger.error('[ModuleManagerDeriveBenchmark] failed', err)
      Alert.alert(
        'Benchmark failed',
        err instanceof Error ? err.message : String(err)
      )
    } finally {
      setRunning(false)
    }
  }, [activeWallet])

  const label = !supported
    ? 'Run MM bench (mnemonic/private-key only)'
    : running
    ? 'Running MM bench…'
    : 'Run ModuleManager derive benchmark'

  return (
    <TouchableOpacity
      sx={{
        alignItems: 'center',
        // Distinctive color so it's impossible to miss while debugging.
        // Different hue from the per-chain bench button above so they're
        // easy to tell apart at a glance. Restyle / restore before merge.
        backgroundColor: '#3D7DFF',
        borderRadius: 12,
        padding: 14,
        opacity: !supported || running ? 0.5 : 1
      }}
      disabled={!supported || running}
      onPress={onPress}>
      <Text
        variant="body1"
        sx={{ color: '#FFFFFF', lineHeight: 20, fontWeight: '700' }}>
        🔵 {label}
      </Text>
    </TouchableOpacity>
  )
}
