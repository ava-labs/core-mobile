import React, { FC, useEffect } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import OvalTagBg from 'components/OvalTagBg'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import ConfirmationTracker from 'screens/bridge/components/ConfirmationTracker'
import { useStopwatch } from 'react-timer-hook'

interface Props {
  paddingHorizontal?: number
  confirmationCount: number
  requiredConfirmationCount: number
  complete: boolean
  startTime?: number
  endTime?: number
  started: boolean
}

const padTimeElapsed = (startTime: number, endTime?: number): Date => {
  // based on created time, set elapsed time offset

  const now = Date.now()
  const diff = (endTime || now) - startTime
  const offset = new Date(now + diff)

  return offset
}

function ElapsedTimer({
  startTime,
  endTime
}: {
  startTime: number
  endTime?: number
}) {
  const theme = useApplicationContext().theme
  const { hours, minutes, seconds, reset } = useStopwatch({
    autoStart: !endTime,
    offsetTimestamp: padTimeElapsed(startTime, endTime)
  })

  // Stop the timer when we know the endTime
  useEffect(() => {
    if (endTime) {
      reset(padTimeElapsed(startTime, endTime), false)
    }
    // Cannot add `reset` because it changes on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime])

  const displayedSeconds = seconds.toLocaleString('en-US', {
    minimumIntegerDigits: 2
  })
  const displayedMinutes = minutes.toLocaleString('en-US', {
    minimumIntegerDigits: 2
  })
  const displayedHours = hours > 0 ? hours.toLocaleString('en-US') : undefined

  const complete = !!endTime

  return (
    <OvalTagBg
      style={{
        borderRadius: 50,
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: complete ? theme.colorSuccess : theme.colorBg3
      }}>
      <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
        {displayedHours && `${displayedHours}:`}
        {displayedMinutes}:{displayedSeconds}
        {complete && (
          <>
            {' '}
            <CheckmarkSVG color={theme.white} size={10} />
          </>
        )}
      </AvaText.ButtonSmall>
    </OvalTagBg>
  )
}

const BridgeConfirmations: FC<Props> = ({
  confirmationCount,
  requiredConfirmationCount,
  startTime,
  endTime = 0,
  paddingHorizontal = 16,
  started = false
}) => {
  return (
    <View>
      <AvaListItem.Base
        title={<AvaText.Body2>Confirmations</AvaText.Body2>}
        titleAlignment="flex-start"
        rightComponent={
          <Row style={{ alignItems: 'center' }}>
            <AvaText.Heading3 textStyle={{ marginEnd: 8 }}>
              {confirmationCount > // to avoid showing 16/15 since confirmations keep going up
              requiredConfirmationCount
                ? requiredConfirmationCount
                : confirmationCount}
              /{requiredConfirmationCount}
            </AvaText.Heading3>
            {startTime && (
              <ElapsedTimer startTime={startTime} endTime={endTime} />
            )}
          </Row>
        }
      />
      <View style={{ paddingHorizontal: paddingHorizontal }}>
        <ConfirmationTracker
          started={started}
          requiredCount={requiredConfirmationCount}
          currentCount={
            confirmationCount > requiredConfirmationCount
              ? requiredConfirmationCount
              : confirmationCount
          }
        />
      </View>
    </View>
  )
}

export default BridgeConfirmations
