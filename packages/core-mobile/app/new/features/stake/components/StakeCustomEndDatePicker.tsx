import { DateTimePicker } from '@avalabs/k2-alpine'
import { UTCDate } from '@date-fns/utc'
import { useNow } from 'hooks/time/useNow'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  getMaximumStakeEndDate,
  getMinimumStakeEndTime
} from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const StakeCustomEndDatePicker = ({
  customEndDate,
  isVisible,
  setIsVisible,
  onDateSelected,
  onCancel,
  maxDate
}: {
  customEndDate: Date | undefined
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  onDateSelected: (date: Date) => void
  onCancel: () => void
  /**
   * Optional upper bound (e.g. the selected validator's end time in the
   * advanced delegate flow). Capped against the protocol maximum.
   */
  maxDate?: Date
}): JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const now = useNow()

  const minimumStakeEndDate = useMemo(
    () => getMinimumStakeEndTime(isDeveloperMode, new UTCDate(now)),
    [isDeveloperMode, now]
  )
  const maximumStakeEndDate = useMemo(() => {
    const protocolMax = getMaximumStakeEndDate()
    const capped =
      maxDate && maxDate.getTime() < protocolMax.getTime()
        ? maxDate
        : protocolMax
    // Never let the maximum fall before the minimum: a validator ending sooner
    // than the protocol minimum stake end time would make `maximumDate <
    // minimumDate`, which can crash/misbehave the native date picker.
    return capped.getTime() < minimumStakeEndDate.getTime()
      ? minimumStakeEndDate
      : capped
  }, [maxDate, minimumStakeEndDate])

  return (
    <DateTimePicker
      date={customEndDate ?? minimumStakeEndDate}
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      onDateSelected={onDateSelected}
      onCancel={onCancel}
      minimumDate={minimumStakeEndDate}
      maximumDate={maximumStakeEndDate}
    />
  )
}
