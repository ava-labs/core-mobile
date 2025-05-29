import { useCallback, useEffect, useState } from 'react'
import {
  getLastKnownPositionAsync,
  LocationGeocodedAddress,
  reverseGeocodeAsync
} from 'expo-location'
import { useLocationPermission } from './useLocationPermission'

type LastKnownPosition = {
  region?: string
  country?: string
  isoCountryCode?: string
}

export const useLastKnownPosition = (): {
  lastKnownPosition?: LastKnownPosition
} => {
  const { granted } = useLocationPermission()
  const [lastKnownPosition, setLastKnownPosition] = useState<
    LastKnownPosition | undefined
  >(undefined)

  const reversedGeocode = useCallback(async (): Promise<
    LocationGeocodedAddress[] | undefined
  > => {
    if (!granted) return undefined
    const position = await getLastKnownPositionAsync()
    if (!position) return undefined
    const geocodedAddress = await reverseGeocodeAsync({
      longitude: position?.coords.longitude,
      latitude: position?.coords.latitude
    })

    if (geocodedAddress[0]) {
      const lkp = {
        region: geocodedAddress[0].region ?? undefined,
        country: geocodedAddress[0].country ?? undefined,
        isoCountryCode: geocodedAddress[0].isoCountryCode ?? undefined
      }
      setLastKnownPosition(lkp)
    }
  }, [granted])

  useEffect(() => {
    reversedGeocode()
  }, [reversedGeocode])

  return { lastKnownPosition }
}
