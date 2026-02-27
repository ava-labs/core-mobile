/**
 * E2E Auto Import Gate
 *
 * When E2E_MNEMONIC is present in launch args, auto-imports wallet and logs in on app start.
 *
 * Only runs in Debug/Internal builds.
 */
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import {
  onAppUnlocked,
  onLogIn,
  setWalletType
} from 'store/app/slice'
import { selectWalletState } from 'store/app/slice'
import { WalletState } from 'store/app/types'
import { importMnemonicWalletAndAccount } from 'store/wallet/thunks'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { isDebugOrInternalBuild } from 'utils/Utils'

const E2E_PIN = '000000'

export function E2EAutoImportGate({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const dispatch = useDispatch()
  const walletState = useSelector(selectWalletState)
  const [isImporting, setIsImporting] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (!isDebugOrInternalBuild() || walletState !== WalletState.NONEXISTENT) {
      setHasChecked(true)
      return
    }

    let cancelled = false

    const runE2EAutoImport = async (): Promise<void> => {
      try {
        let args: Record<string, string> | undefined
        try {
          const { LaunchArguments } = require('react-native-launch-arguments')
          args = LaunchArguments.value() as Record<string, string> | undefined
        } catch {
          setHasChecked(true)
          return
        }
        const mnemonic = args?.E2E_MNEMONIC?.trim()

        if (!mnemonic || mnemonic.length < 20) {
          setHasChecked(true)
          return
        }

        Logger.info('[E2E Auto Import] E2E_MNEMONIC detected in launch args, starting auto import')
        setIsImporting(true)

        const encryptionKey = await BiometricsSDK.generateEncryptionKey()
        await BiometricsSDK.storeEncryptionKeyWithPin(encryptionKey, E2E_PIN)

        if (cancelled) return

        await dispatch(
          importMnemonicWalletAndAccount({
            mnemonic,
            name: 'Account 1'
          })
        ).unwrap()

        if (cancelled) return

        dispatch(setWalletType(WalletType.MNEMONIC))
        dispatch(onAppUnlocked())
        dispatch(onLogIn())

        Logger.info('[E2E Auto Import] Complete')
      } catch (error) {
        Logger.error('[E2E Auto Import] Failed:', error)
      } finally {
        if (!cancelled) {
          setIsImporting(false)
          setHasChecked(true)
        }
      }
    }

    runE2EAutoImport()
    return () => {
      cancelled = true
    }
  }, [dispatch, walletState])

  if (isImporting) {
    return null
  }

  return <>{children}</>
}
