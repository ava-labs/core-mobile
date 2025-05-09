import { setIsDeveloperMode as _setIsDeveloperMode } from 'store/settings/advanced'
import { Dispatch } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from './toast'

export function setIsDeveloperMode(value: boolean, dispatch: Dispatch): void {
  AnalyticsService.capture(
    value ? 'DeveloperModeEnabled' : 'DeveloperModeDisabled'
  )
  dispatch(_setIsDeveloperMode(value))
  showSnackbar('Testnet mode is now ' + (value ? 'on' : 'off'))
}
