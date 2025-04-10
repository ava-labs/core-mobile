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
  onCancel
}: {
  customEndDate: Date | undefined
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  onDateSelected: (date: Date) => void
  onCancel: () => void
}): JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const now = useNow()

  const minimumStakeEndDate = useMemo(
    () => getMinimumStakeEndTime(isDeveloperMode, new UTCDate(now)),
    [isDeveloperMode, now]
  )
  const maximumStakeEndDate = useMemo(() => getMaximumStakeEndDate(), [])

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
