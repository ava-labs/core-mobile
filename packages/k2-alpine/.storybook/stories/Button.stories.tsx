import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../../src/components/button/Button'

const ButtonMeta: Meta<typeof Button> = {
  title: 'Button',
  component: Button,
  argTypes: {
    onPress: { action: 'pressed the button' }
  },
  args: {
    onPress: () => {},
    children: 'Next',
    type: 'primary'
  }
}

export default ButtonMeta

export const Basic: StoryObj<typeof Button> = {}
