import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import QuestionSVG from 'components/svg/QuestionSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { Popable } from 'react-native-popable'

const UnableToEstimate = () => {
  const { theme } = useApplicationContext()

  return (
    <Popable
      content={PopableContent({
        message: 'Unable to estimate due to network conditions'
      })}
      position="top"
      strictPosition={true}
      style={{ minWidth: 218 }}
      backgroundColor={theme.neutral100}>
      <PopableLabel
        label="Unable to Estimate"
        textStyle={{ color: theme.white }}
        icon={<QuestionSVG color={theme.neutral50} />}
      />
    </Popable>
  )
}

export default UnableToEstimate
