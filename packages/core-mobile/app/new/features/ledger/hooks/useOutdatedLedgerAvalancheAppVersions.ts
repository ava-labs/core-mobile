import { LEDGER_DEVICE_BRIEF_DELAY_MS } from 'features/ledger/consts'
import { isAppVersionOutdated } from 'features/ledger/utils/appVersion'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import LedgerService from 'services/ledger/LedgerService'
import { selectLedgerAvalancheAppRecommendedVersion } from 'store/posthog'

export type OutdatedLedgerAppVersions = {
  currentVersion: string
  recommendedVersion: string
}

export const useOutdatedLedgerAvalancheAppVersions = ():
  | OutdatedLedgerAppVersions
  | undefined => {
  const recommendedVersion = useSelector(
    selectLedgerAvalancheAppRecommendedVersion
  )
  const [installedVersion, setInstalledVersion] = useState(() =>
    LedgerService.getAvalancheAppVersion()
  )

  useEffect(() => {
    if (!recommendedVersion) return

    const readVersion = (): void =>
      setInstalledVersion(LedgerService.getAvalancheAppVersion())

    readVersion()
    const interval = setInterval(readVersion, LEDGER_DEVICE_BRIEF_DELAY_MS)
    return () => clearInterval(interval)
  }, [recommendedVersion])

  if (
    !recommendedVersion ||
    !isAppVersionOutdated(installedVersion, recommendedVersion)
  ) {
    return undefined
  }

  return { currentVersion: installedVersion, recommendedVersion }
}
