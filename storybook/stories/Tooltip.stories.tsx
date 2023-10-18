import React, { useState } from 'react'
import type { Meta } from '@storybook/react-native'
import { Tooltip } from 'components/Tooltip'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'Tooltip',
  decorators: [withCenterView]
} as Meta

export const Default = (): JSX.Element => {
  const [position, setPosition] = useState<
    'top' | 'right' | 'bottom' | 'left' | undefined
  >('left')
  return (
    <>
      <Tooltip
        content={`this is popover content with a lot of text. There are a number of reasons you may need a block of text and when you do, a random paragraph can be the perfect solution. If you happen to be a web designer and you need some random text to show in your layout, a random paragraph can be an excellent way to do this. If you are a programmer and you need random text to test the program, using these paragraphs can be the perfect way to do this. Anyone who's in search of realistic text for a project can use one or more of these random paragraphs to fill their need.`}
        children={'click to show tooltip'}
        position={position}
        style={{ width: 200 }}
      />
      <Space y={20} />
      <AvaButton.TextMedium onPress={() => setPosition('bottom')}>
        Position: Bottom
      </AvaButton.TextMedium>
      <AvaButton.TextMedium onPress={() => setPosition('top')}>
        Position: Top
      </AvaButton.TextMedium>
      <AvaButton.TextMedium onPress={() => setPosition('left')}>
        Position: Left
      </AvaButton.TextMedium>
      <AvaButton.TextMedium onPress={() => setPosition('right')}>
        Position: Right
      </AvaButton.TextMedium>
    </>
  )
}
