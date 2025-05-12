// import React, { useEffect, useState } from 'react'
// import { ScrollView } from 'react-native'
// import { useApplicationContext } from 'contexts/ApplicationContext'
// import AvaListItem from 'components/AvaListItem'
// import DeviceInfo from 'react-native-device-info'
// import AvaText from 'components/AvaText'

// export default function DebugDeviceInfoScreen(): JSX.Element {
//   const { theme } = useApplicationContext()
//   const [deviceInfo, setDeviceInfo] = useState({
//     bundleId: '',
//     buildNumber: '',
//     version: '',
//     deviceId: '',
//     deviceName: '',
//     systemVersion: ''
//   })

//   useEffect(() => {
//     async function loadDeviceInfo(): Promise<void> {
//       const deviceName = await DeviceInfo.getDeviceName()

//       setDeviceInfo({
//         bundleId: DeviceInfo.getBundleId(),
//         buildNumber: DeviceInfo.getBuildNumber(),
//         version: DeviceInfo.getVersion(),
//         deviceId: DeviceInfo.getDeviceId(),
//         deviceName,
//         systemVersion: DeviceInfo.getSystemVersion()
//       })
//     }

//     loadDeviceInfo()
//   }, [])

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: theme.colorBg1 }}>
//       <AvaListItem.Base
//         disabled
//         title="Bundle ID"
//         titleAlignment="flex-start"
//         rightComponent={<AvaText.Body2>{deviceInfo.bundleId}</AvaText.Body2>}
//       />
//       <AvaListItem.Base
//         disabled
//         title="Build Number"
//         titleAlignment="flex-start"
//         rightComponent={<AvaText.Body2>{deviceInfo.buildNumber}</AvaText.Body2>}
//       />
//       <AvaListItem.Base
//         disabled
//         title="Version"
//         titleAlignment="flex-start"
//         rightComponent={<AvaText.Body2>{deviceInfo.version}</AvaText.Body2>}
//       />
//       <AvaListItem.Base
//         disabled
//         title="Device ID"
//         titleAlignment="flex-start"
//         rightComponent={<AvaText.Body2>{deviceInfo.deviceId}</AvaText.Body2>}
//       />
//       <AvaListItem.Base
//         disabled
//         title="Device Name"
//         titleAlignment="flex-start"
//         rightComponent={<AvaText.Body2>{deviceInfo.deviceName}</AvaText.Body2>}
//       />
//       <AvaListItem.Base
//         disabled
//         title="System Version"
//         titleAlignment="flex-start"
//         rightComponent={
//           <AvaText.Body2>{deviceInfo.systemVersion}</AvaText.Body2>
//         }
//       />
//     </ScrollView>
//   )
// }
