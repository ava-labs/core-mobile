// if you use expo remove this line
import './rn-addons'
import {AppRegistry} from 'react-native'
import {addDecorator, configure, getStorybookUI} from '@storybook/react-native'
import {withKnobs} from '@storybook/addon-knobs'
import {NetworkContextProvider} from '@avalabs/wallet-react-components'
import {ApplicationContextProvider} from '../app/contexts/ApplicationContext'
import useDevDebugging from '../app/utils/debugging/DevDebugging'
import {loadStories} from './storyLoader'

// enables knobs for all stories
addDecorator(withKnobs)

// import stories
configure(() => {
  loadStories()
}, module)

addDecorator(getStory => (
  <NetworkContextProvider>
    <ApplicationContextProvider>{getStory()}</ApplicationContextProvider>
  </NetworkContextProvider>
))

// Refer to https://github.com/storybookjs/react-native/tree/master/app/react-native#getstorybookui-options
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({
  resetStorybook: true,
  asyncStorage: null
})

// If you are using React Native vanilla and after installation you don't see your app name here, write it manually.
// If you use Expo you should remove this line.
const ReactStorybookRoot = () => {
  useDevDebugging().configure()

  return <StorybookUIRoot />
}
AppRegistry.registerComponent('AvaxWallet', () => ReactStorybookRoot)

export default ReactStorybookRoot
