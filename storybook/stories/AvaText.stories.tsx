import React from 'react'
import { View } from 'react-native'
import type { ComponentStory, Meta } from '@storybook/react-native'
import AvaText from 'components/AvaText'
import CenterView from '../decorators/CenterView'

const AllTexts = () => {
  return (
    <View>
      <AvaText.Heading1>Heading 1</AvaText.Heading1>
      <AvaText.Heading2>Heading 2</AvaText.Heading2>
      <AvaText.Heading3>Heading 3</AvaText.Heading3>
      <AvaText.Heading4>Heading 4</AvaText.Heading4>
      <AvaText.Heading5>Heading 5</AvaText.Heading5>
      <AvaText.Subtitle1>Subtitle 1</AvaText.Subtitle1>
      <AvaText.Subtitle2>Subtitle 2</AvaText.Subtitle2>
      <AvaText.Body1>Body 1</AvaText.Body1>
      <AvaText.Body2>Body 2</AvaText.Body2>
      <AvaText.Body3 color={'gray'}>Body 3</AvaText.Body3>
      <AvaText.Body4 color={'gray'}>Body 4</AvaText.Body4>
      <AvaText.TextLink color={'gray'}>Text Link</AvaText.TextLink>
      <AvaText.Tag>Tag</AvaText.Tag>
      <AvaText.Caption color={'gray'}>Caption</AvaText.Caption>
      <AvaText.ActivityTotal>Activity Total</AvaText.ActivityTotal>
      <AvaText.ButtonSmall color={'white'}>Button Small</AvaText.ButtonSmall>
      <AvaText.ButtonMedium color={'white'}>Button Medium</AvaText.ButtonMedium>
      <AvaText.ButtonLarge>Button Large</AvaText.ButtonLarge>
      <AvaText.LargeTitleBold>Large Title Bold</AvaText.LargeTitleBold>
      <AvaText.LargeTitleRegular>Large Title Regular</AvaText.LargeTitleRegular>
      <AvaText.ExtraLargeTitle>Extra Large Title</AvaText.ExtraLargeTitle>
    </View>
  )
}

export default {
  title: 'AvaText',
  component: AllTexts,
  decorators: [
    Story => (
      <CenterView>
        <Story />
      </CenterView>
    )
  ]
} as Meta

export const All = {}

export const Heading1: ComponentStory<typeof AvaText.Heading1> = args => {
  return <AvaText.Heading1 {...args}>{args.children}</AvaText.Heading1>
}

Heading1.args = {
  children: 'Heading 1',
  color: 'black',
  textStyle: {},
  ellipsizeMode: undefined,
  currency: false,
  tokenInCurrency: false,
  hideTrailingCurrency: false
}

Heading1.argTypes = {
  ellipsizeMode: {
    options: ['head', 'middle', 'tail', 'clip'],
    control: { type: 'radio' }
  }
}
