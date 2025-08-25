import { startProfiling, stopProfiling } from 'react-native-release-profiler'
import { Platform } from 'react-native'
import { isDebugOrInternalBuild } from 'utils/Utils'

class ProfilingService {
  private isProfilingActive = false

  async startProfilingSession(): Promise<void> {
    if (isDebugOrInternalBuild()) {
      console.log('Profiling is only available in release builds')
      return
    }

    if (this.isProfilingActive) {
      console.log('Profiling session already active')
      return
    }

    try {
      startProfiling()
      this.isProfilingActive = true
      console.log('Profiling session started')
    } catch (error) {
      console.log('Failed to start profiling:', error)
    }
  }

  async stopProfilingSession(): Promise<string | undefined> {
    if (!this.isProfilingActive) {
      console.log('No active profiling session')
      return
    }

    try {
      // Save to downloads directory and get the file path
      const filePath = await stopProfiling(true)
      this.isProfilingActive = false
      console.log('Profiling session stopped, saved to:', filePath)
      return filePath
    } catch (error) {
      console.log('Failed to stop profiling:', error)
      return undefined
    }
  }

  isSessionActive(): boolean {
    return this.isProfilingActive
  }
}

export default new ProfilingService()
