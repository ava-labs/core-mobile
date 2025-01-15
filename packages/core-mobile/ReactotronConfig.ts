import Reactotron, { type ReactotronReactNative } from 'reactotron-react-native'
import mmkvPlugin from 'reactotron-react-native-mmkv'
import { reactotronRedux } from 'reactotron-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { commonStorage } from 'utils/mmkv'

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'Core Mobile'
  })
  .useReactNative({
    asyncStorage: true,
    networking: {
      ignoreUrls: /symbolicate/
    },
    editor: false,
    errors: { veto: _stackFrame => false },
    overlay: false
  })
  .use(mmkvPlugin<ReactotronReactNative>({ storage: commonStorage }))
  .use(reactotronRedux())
  .connect()

export default reactotron
