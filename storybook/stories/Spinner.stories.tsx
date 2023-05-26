import type { Meta } from '@storybook/react-native'
import Spinner from 'components/Spinner'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'Spinner',
  component: Spinner,
  decorators: [withCenterView]
} as Meta

export const Basic = {
  args: {
    size: 100
  }
}
