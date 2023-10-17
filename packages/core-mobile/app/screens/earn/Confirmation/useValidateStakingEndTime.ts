import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { addMinutes, fromUnixTime } from 'date-fns'
import { useNow } from 'hooks/time/useNow'
import { getMinimumStakeDurationMs } from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MilliSeconds, Seconds, convertToSeconds } from 'types/siUnits'

export const useValidateStakingEndTime = (
  stakingEndTime: Date,
  validatorEndTimeStr: string
): {
  minStartTime: Date
  validatedStakingEndTime: Date
  validatedStakingDuration: Seconds
} => {
  const now = useNow()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const minStakeDurationMs = getMinimumStakeDurationMs(isDeveloperMode)

  // minStartTime - 1 minute after submitting
  const minStartTime = useMemo(() => {
    return addMinutes(now, 1)
  }, [now])

  const validatedStakingEndTime = useMemo(() => {
    // check if stake duration is less than minimum, and adjust if necessary
    // this could happen if user selects minimal stake duration but is too long on confirmation screen
    if (
      stakingEndTime.getTime() - minStakeDurationMs <
      minStartTime.getTime()
    ) {
      return new Date(minStartTime.getTime() + minStakeDurationMs)
    }

    // check if stake duration is more than validator's end time,
    // use validator's end time if it is
    const validatorEndTime = fromUnixTime(Number(validatorEndTimeStr))

    if (stakingEndTime > validatorEndTime) {
      return validatorEndTime
    }

    return stakingEndTime
  }, [minStakeDurationMs, minStartTime, stakingEndTime, validatorEndTimeStr])

  const validatedStakingDuration = useMemo(
    () =>
      convertToSeconds(
        BigInt(
          validatedStakingEndTime.getTime() - now.getTime()
        ) as MilliSeconds
      ),
    [now, validatedStakingEndTime]
  )

  return { minStartTime, validatedStakingEndTime, validatedStakingDuration }
}
