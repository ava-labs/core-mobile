import { execFileSync } from 'node:child_process'

export type ResolvedDeviceCaps = {
  deviceName: string
  platformVersion: string
  deviceUdid: string
}

const EMPTY: ResolvedDeviceCaps = {
  deviceName: '',
  platformVersion: '',
  deviceUdid: ''
}

function trim(s: string): string {
  return s.replace(/\r?\n+$/, '').trim()
}

const CHILD_MAX_BUFFER = 1024 * 1024

function getAdbExecutable(): string {
  const fromEnv = process.env.ADB_PATH?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : 'adb'
}

function adbExecFileSync(args: string[]): string {
  return execFileSync(getAdbExecutable(), args, {
    encoding: 'utf8',
    maxBuffer: CHILD_MAX_BUFFER
  })
}

/**
 * When `PLATFORM` is unset locally, prefer Android if `adb devices` shows a device;
 * otherwise assume iOS Simulator (booted or IOS_UDID). On Device Farm, include both
 * capability templates when unset (single platform is still chosen by the run).
 */
export function inferRunPlatforms(
  platformToRun: string | undefined,
  isDeviceFarm: boolean
): { runAndroid: boolean; runIos: boolean } {
  if (platformToRun && platformToRun !== '') {
    const p = platformToRun.toLowerCase()
    return { runAndroid: p === 'android', runIos: p === 'ios' }
  }
  if (isDeviceFarm) {
    return { runAndroid: true, runIos: true }
  }
  const hasAndroid = !!getAndroidSerial()
  const hasIos = hasBootedSimulator()
  if (hasAndroid || hasIos) {
    return { runAndroid: hasAndroid, runIos: hasIos }
  }
  return { runAndroid: false, runIos: true }
}

/**
 * On AWS Device Farm, host injects DEVICEFARM_*; keep env-based values.
 * Locally, resolve Android via adb and iOS via booted Simulator (xcrun simctl).
 */
export function resolveDeviceCaps(
  platform: 'Android' | 'iOS',
  isDeviceFarm: boolean
): ResolvedDeviceCaps {
  if (isDeviceFarm) {
    return {
      deviceName: process.env.DEVICEFARM_DEVICE_NAME || 'device',
      platformVersion: process.env.DEVICEFARM_DEVICE_OS_VERSION || '14.0',
      deviceUdid: process.env.DEVICEFARM_DEVICE_UDID || ''
    }
  }
  if (platform === 'Android') {
    return resolveAndroidLocal()
  }
  return resolveIosLocal()
}

export function getAndroidSerial(): string | null {
  let out: string
  try {
    out = adbExecFileSync(['devices'])
  } catch {
    return null
  }
  const devices: string[] = []
  for (const line of out.split('\n').slice(1)) {
    const m = line.match(/^(\S+)\s+(\w+)/)
    if (m?.[2] === 'device' && m[1]) {
      devices.push(m[1])
    }
  }
  if (devices.length === 0) return null
  const preferred = process.env.ANDROID_SERIAL
  if (preferred && devices.includes(preferred)) return preferred
  if (devices.length > 1 && !preferred) {
    console.warn(
      `[resolve-local-device] Multiple Android devices (${devices.join(
        ', '
      )}); using ${devices[0]}. Set ANDROID_SERIAL to pick one.`
    )
  }
  return devices[0] ?? null
}

function resolveAndroidLocal(): ResolvedDeviceCaps {
  const serial = getAndroidSerial()
  if (!serial) {
    throw new Error(
      '[resolve-local-device] No Android device/emulator found. Run `adb devices`, start an emulator, or connect a device.'
    )
  }
  const version = trim(
    adbExecFileSync([
      '-s',
      serial,
      'shell',
      'getprop',
      'ro.build.version.release'
    ])
  )
  const model = trim(
    adbExecFileSync(['-s', serial, 'shell', 'getprop', 'ro.product.model'])
  )
  return {
    deviceName: model || serial,
    platformVersion: version,
    deviceUdid: serial
  }
}

function parseIosRuntimeVersion(runtimeKey: string): string {
  const m = runtimeKey.match(/iOS-(\d+)(?:-(\d+))?/i)
  if (!m) return ''
  const minor = m[2] !== undefined ? m[2] : '0'
  return `${m[1]}.${minor}`
}

type SimctlDevicesJson = {
  devices?: Record<
    string,
    Array<{ state?: string; name?: string; udid?: string }>
  >
}

function hasBootedSimulator(): boolean {
  try {
    const raw = execFileSync(
      'xcrun',
      ['simctl', 'list', 'devices', 'booted', '-j'],
      {
        encoding: 'utf8',
        maxBuffer: CHILD_MAX_BUFFER
      }
    )
    const parsed = JSON.parse(raw) as SimctlDevicesJson
    const buckets = parsed.devices
    if (!buckets) return false
    return Object.values(buckets).some(
      list => Array.isArray(list) && list.some(d => d.state === 'Booted')
    )
  } catch {
    return false
  }
}

function findSimulatorByUdid(udid: string): {
  name: string
  udid: string
  platformVersion: string
} | null {
  let raw: string
  try {
    raw = execFileSync('xcrun', ['simctl', 'list', 'devices', '-j'], {
      encoding: 'utf8',
      maxBuffer: CHILD_MAX_BUFFER
    })
  } catch {
    return null
  }
  const parsed = JSON.parse(raw) as SimctlDevicesJson
  const buckets = parsed.devices
  if (!buckets) return null
  for (const [runtime, list] of Object.entries(buckets)) {
    if (!Array.isArray(list)) continue
    for (const d of list) {
      if (d.udid === udid && d.name) {
        const pv = parseIosRuntimeVersion(runtime)
        return {
          name: d.name,
          udid,
          platformVersion: pv || '17.0'
        }
      }
    }
  }
  return null
}

function resolveIosCapsForExplicitUdid(udid: string): ResolvedDeviceCaps {
  const found = findSimulatorByUdid(udid)
  if (found) {
    return {
      deviceName: found.name,
      platformVersion: found.platformVersion,
      deviceUdid: found.udid
    }
  }
  const physicalName = process.env.IOS_DEVICE_NAME?.trim()
  const physicalVer = process.env.IOS_PLATFORM_VERSION?.trim()
  if (physicalName && physicalVer) {
    return {
      deviceName: physicalName,
      platformVersion: physicalVer,
      deviceUdid: udid
    }
  }
  throw new Error(
    '[resolve-local-device] IOS_UDID is set but not found in simctl. For a physical device, set IOS_DEVICE_NAME and IOS_PLATFORM_VERSION. Otherwise clear IOS_UDID to use the booted Simulator.'
  )
}

function firstBootedSimulatorInBuckets(
  buckets: NonNullable<SimctlDevicesJson['devices']>
): ResolvedDeviceCaps | null {
  for (const [runtime, list] of Object.entries(buckets)) {
    if (!Array.isArray(list)) continue
    for (const d of list) {
      if (d.state === 'Booted' && d.udid && d.name) {
        const pv = parseIosRuntimeVersion(runtime)
        return {
          deviceName: d.name,
          platformVersion: pv || '17.0',
          deviceUdid: d.udid
        }
      }
    }
  }
  return null
}

function resolveIosLocal(): ResolvedDeviceCaps {
  const udidFromEnv = process.env.IOS_UDID?.trim()
  if (udidFromEnv) {
    return resolveIosCapsForExplicitUdid(udidFromEnv)
  }

  let raw: string
  try {
    raw = execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], {
      encoding: 'utf8',
      maxBuffer: CHILD_MAX_BUFFER
    })
  } catch (e) {
    throw new Error(
      `[resolve-local-device] Failed to list booted iOS simulators: ${
        e instanceof Error ? e.message : String(e)
      }`
    )
  }
  const parsed = JSON.parse(raw) as SimctlDevicesJson
  const buckets = parsed.devices
  if (!buckets) {
    throw new Error(
      '[resolve-local-device] No booted iOS Simulator. Open Simulator, boot a device, or set IOS_UDID to a simulator UDID (see `xcrun simctl list devices`).'
    )
  }
  const booted = firstBootedSimulatorInBuckets(buckets)
  if (booted) {
    return booted
  }
  throw new Error(
    '[resolve-local-device] No booted iOS Simulator. Open Simulator, boot a device, or set IOS_UDID to a simulator UDID.'
  )
}

/** Placeholder when the other platform’s caps are not needed (filtered out by PLATFORM). */
export function unusedPlatformCaps(): ResolvedDeviceCaps {
  return { ...EMPTY }
}
