import React, { FC, useCallback, useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { SegmentedControl } from '../../SegmentedControl/SegmentedControl'
import { CHART_RANGES, ChartRange } from './types'

type Props = {
  value: ChartRange
  onChange: (range: ChartRange) => void
}

export const ChartRangeSelector: FC<Props> = ({ value, onChange }) => {
  const selectedSegmentIndex = useSharedValue(0)

  // Update the animated value when the controlled value changes
  useEffect(() => {
    const index = CHART_RANGES.indexOf(value)
    if (index !== -1) {
      selectedSegmentIndex.value = index
    }
  }, [value, selectedSegmentIndex])

  const handleSelectSegment = useCallback(
    (index: number) => {
      const next = CHART_RANGES[index]
      if (next) onChange(next)
    },
    [onChange]
  )

  // Convert ChartRange array to SegmentedControl items format
  const items = CHART_RANGES.map(range => ({ title: range }))

  return (
    <SegmentedControl
      dynamicItemWidth={false}
      items={items}
      type="thin"
      selectedSegmentIndex={selectedSegmentIndex}
      onSelectSegment={handleSelectSegment}
    />
  )
}
