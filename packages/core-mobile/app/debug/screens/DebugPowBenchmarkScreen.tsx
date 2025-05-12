// import React, { useState, useEffect } from 'react'
// import { ScrollView, View } from 'react-native'
// import { useApplicationContext } from 'contexts/ApplicationContext'
// import AvaListItem from 'components/AvaListItem'
// import AvaText from 'components/AvaText'
// import AvaButton from 'components/AvaButton'
// import InputText from 'components/InputText'
// import Logger from 'utils/Logger'
// import { GaslessSdk } from '@avalabs/core-gasless-sdk'
// import Config from 'react-native-config'
// import AppCheckService from 'services/fcm/AppCheckService'

// const SOLVE_CHALLENGE_TIMEOUT = 10000 // 10 seconds in milliseconds

// export default function DebugPowBenchmarkScreen(): JSX.Element {
//   const { theme } = useApplicationContext()
//   const [challenge, setChallenge] = useState(
//     '5ebda28c31710fc96366e670723ac930837b0d215edc5c36acf98b9ea8219571'
//   )
//   const [difficulty, setDifficulty] = useState('')
//   const [elapsedTime, setElapsedTime] = useState<number | null>(null)
//   const [isRunning, setIsRunning] = useState(false)
//   const [sdk, setSdk] = useState<GaslessSdk | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     const initSdk = async (): Promise<void> => {
//       if (!Config.GAS_STATION_URL) {
//         Logger.warn('GAS_STATION_URL is missing')
//         return
//       }
//       const newSdk = new GaslessSdk(Config.GAS_STATION_URL)
//       const appCheckToken = (await AppCheckService.getToken()).token
//       newSdk.setAppCheckToken(appCheckToken)
//       setSdk(newSdk)
//     }
//     initSdk()
//   }, [])

//   const handleRun = async (): Promise<void> => {
//     if (!sdk) {
//       Logger.error('SDK not initialized')
//       return
//     }

//     try {
//       setIsRunning(true)
//       setElapsedTime(null)
//       setError(null)

//       // Add small delay to let UI update
//       await new Promise(resolve => setTimeout(resolve, 100))

//       const startTime = performance.now()

//       const challengeHex = challenge
//       const difficultyNum = parseInt(difficulty)

//       if (!challengeHex || !difficultyNum) {
//         return
//       }

//       const { solutionHex } = await sdk.solveChallenge(
//         challengeHex,
//         difficultyNum,
//         SOLVE_CHALLENGE_TIMEOUT
//       )

//       const endTime = performance.now()

//       setElapsedTime(endTime - startTime)
//       Logger.info('POW Benchmark', {
//         elapsedTime: endTime - startTime,
//         challengeHex,
//         difficulty: difficultyNum,
//         solutionHex
//       })
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error'
//       setError(errorMessage)
//       Logger.error('POW Benchmark failed', err)
//     } finally {
//       setIsRunning(false)
//     }
//   }

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: theme.colorBg1 }}>
//       <View style={{ padding: 16 }}>
//         <InputText
//           label="Challenge"
//           text={challenge}
//           onChangeText={setChallenge}
//           placeholder="Enter challenge hex"
//         />
//         <InputText
//           label="Difficulty"
//           text={difficulty}
//           onChangeText={setDifficulty}
//           placeholder="Enter difficulty number"
//           keyboardType="numeric"
//         />
//         <AvaButton.PrimaryMedium
//           onPress={handleRun}
//           disabled={isRunning || !sdk || !challenge || !difficulty}
//           style={{ marginTop: 16 }}>
//           Run Benchmark
//         </AvaButton.PrimaryMedium>
//       </View>

//       {elapsedTime !== null && (
//         <AvaListItem.Base
//           title="Elapsed Time"
//           titleAlignment="flex-start"
//           rightComponent={
//             <AvaText.Body2>{elapsedTime.toFixed()} ms</AvaText.Body2>
//           }
//         />
//       )}

//       {error && (
//         <AvaListItem.Base
//           title="Error"
//           titleAlignment="flex-start"
//           rightComponent={<AvaText.Body2>{error}</AvaText.Body2>}
//         />
//       )}

//       <AvaListItem.Base
//         title="Note"
//         titleAlignment="flex-start"
//         rightComponent={
//           <AvaText.Body2>
//             Execution time limit is {SOLVE_CHALLENGE_TIMEOUT / 1000} seconds
//           </AvaText.Body2>
//         }
//       />
//     </ScrollView>
//   )
// }
