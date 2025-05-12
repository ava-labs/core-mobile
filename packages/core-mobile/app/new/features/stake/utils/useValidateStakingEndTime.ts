import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { addMinutes, fromUnixTime } from 'date-fns'
import { useNow } from 'hooks/time/useNow'
import { getMinimumStakeDurationMs } from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MilliSeconds, Seconds, convertToSeconds } from 'types/siUnits'
import { UTCDate } from '@date-fns/utc'
import { UnixTime } from 'services/earn/types'
import { utc } from '@date-fns/utc/utc'

export const useValidateStakingEndTime = (
  stakingEndTime: UTCDate,
  validatorEndTimeStr: UnixTime
): {
  minStartTime: UTCDate
  validatedStakingEndTime: UTCDate
  validatedStakingDuration: Seconds
} => {
  const currentUnixMs = useNow()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const minStakeDurationMs = getMinimumStakeDurationMs(isDeveloperMode)

  // minStartTime - 1 minute after submitting
  const minStartTime = useMemo(() => {
    return addMinutes(new UTCDate(currentUnixMs), 1)
  }, [currentUnixMs])

  const validatedStakingEndTime = useMemo(() => {
    // check if stake duration is less than minimum, and adjust if necessary
    // this could happen if user selects minimal stake duration but is too long on confirmation screen
    if (
      stakingEndTime.getTime() - minStakeDurationMs <
      minStartTime.getTime()
    ) {
      return new UTCDate(minStartTime.getTime() + minStakeDurationMs)
    }

    // check if stake duration is more than validator's end time,
    // use validator's end time if it is
    const validatorEndTime = fromUnixTime(validatorEndTimeStr, { in: utc })

    if (stakingEndTime > validatorEndTime) {
      return validatorEndTime
    }

    return stakingEndTime
  }, [minStakeDurationMs, minStartTime, stakingEndTime, validatorEndTimeStr])

  const validatedStakingDuration = useMemo(
    () =>
      convertToSeconds(
        BigInt(
          validatedStakingEndTime.getTime() - currentUnixMs
        ) as MilliSeconds
      ),
    [currentUnixMs, validatedStakingEndTime]
  )

  return { minStartTime, validatedStakingEndTime, validatedStakingDuration }
}
