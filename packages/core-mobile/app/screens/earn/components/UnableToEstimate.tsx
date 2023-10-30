import { Tooltip } from 'components/Tooltip'
import QuestionSVG from 'components/svg/QuestionSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'

const UnableToEstimate = (): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <Tooltip
      content={'Unable to estimate due to network conditions'}
      style={{ width: 218 }}
      caretPosition="right"
      caretStyle={{ margin: 5 }}
      textStyle={{ color: theme.white }}
      icon={<QuestionSVG color={theme.neutral50} />}>
      Unable to Estimate
    </Tooltip>
  )
}

export default UnableToEstimate
