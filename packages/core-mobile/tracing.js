import { startProfiling, stopProfiling } from 'react-native-release-profiler'

startProfiling()

setTimeout(async () => {
  await stopProfiling(true)
}, 45000)
