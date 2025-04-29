// TODO: reanble DataDogService
// import { DdSdkReactNative } from '@datadog/mobile-react-native'
// import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation'
// import { NavigationContainerRefWithCurrent } from '@react-navigation/native'
// import Config from 'react-native-config'
// import DataDogConfig from 'services/datadog/DataDogConfig'
// import Logger from 'utils/Logger'

// export const DataDogService = {
//   init: async (
//     navigationRef: NavigationContainerRefWithCurrent<RootScreenStackParamList>
//   ) => {
//     if (Config.E2E_MNEMONIC) {
//       const config = DataDogConfig
//       if (config) {
//         try {
//           await DdSdkReactNative.initialize(config)
//           DataDogService.startRumTracking(navigationRef)
//         } catch (error) {
//           Logger.error('Error initializing Datadog:', error)
//         }
//       }
//     }
//   },

//   startRumTracking: (
//     navigationRef: NavigationContainerRefWithCurrent<RootScreenStackParamList>
//   ) => {
//     if (navigationRef) {
//       DdRumReactNavigationTracking.startTrackingViews(navigationRef.current)
//     } else {
//       Logger.error(
//         'Failed to start RUM tracking: navigationRef is null or undefined'
//       )
//     }
//   }
// }

// export default DataDogService
