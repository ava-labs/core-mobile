import DeviceInfo from 'react-native-device-info'
import { getLocales, getTimeZone } from 'react-native-localize'

class DeviceInfoService {
  private appBuild?: string
  private appName?: string
  private appNamespace?: string
  private appVersion?: string
  private deviceManufacturer?: string
  private deviceModel?: string
  private deviceName?: string
  private deviceType?: string
  private locale?: string
  private networkCarrier?: string
  private operatingSystemName?: string
  private operatingSystemVersion?: string
  private timezone?: string
  private bundleId?: string

  getAppBuild = (): string => {
    if (this.appBuild) return this.appBuild

    const build = DeviceInfo.getBuildNumber()
    this.appBuild = build
    return build
  }

  getAppName = (): string => {
    if (this.appName) return this.appName

    const applicationName = DeviceInfo.getApplicationName()
    this.appName = applicationName
    return applicationName
  }

  getAppNameSpace = (): string => {
    if (this.appNamespace) return this.appNamespace

    const space = DeviceInfo.getBundleId()
    this.appNamespace = space
    return space
  }

  getAppVersion = (): string => {
    if (this.appVersion) return this.appVersion

    const version = DeviceInfo.getVersion()
    this.appVersion = version
    return version
  }

  getDeviceManufacturer = async (): Promise<string> => {
    if (this.deviceManufacturer) return this.deviceManufacturer

    const manufacturer = await DeviceInfo.getManufacturer()
    this.deviceManufacturer = manufacturer
    return manufacturer
  }

  getDeviceModel = (): string => {
    if (this.deviceModel) return this.deviceModel

    const model = DeviceInfo.getDeviceId()
    this.deviceModel = model
    return model
  }

  getDeviceName = async (): Promise<string> => {
    if (this.deviceName) return this.deviceName

    const name = await DeviceInfo.getDeviceName()
    this.deviceName = name
    return name
  }

  getDeviceType = async (): Promise<string> => {
    if (this.deviceType) return this.deviceType

    const type = DeviceInfo.getSystemName()
    this.deviceType = type
    return type
  }

  getOperatingSystemName = async (): Promise<string> => {
    if (this.operatingSystemName) return this.operatingSystemName

    const systemName = await DeviceInfo.getSystemName()
    this.operatingSystemName = systemName
    return systemName
  }

  getOperatingSystemVersion = async (): Promise<string> => {
    if (this.operatingSystemVersion) return this.operatingSystemVersion

    const systemVersion = await DeviceInfo.getSystemVersion()
    this.operatingSystemVersion = systemVersion
    return systemVersion
  }

  getNetworkCarrier = async (): Promise<string> => {
    if (this.networkCarrier) return this.networkCarrier

    const carrier = await DeviceInfo.getCarrier()
    this.networkCarrier = carrier
    return carrier
  }

  getLocale = (): string | undefined => {
    if (this.locale) return this.locale

    const preferredLocal = getLocales()[0]?.languageTag
    this.locale = preferredLocal
    return preferredLocal
  }

  getTimezone = (): string => {
    if (this.timezone) return this.timezone

    const time = getTimeZone()
    this.timezone = time
    return time
  }

  getBundleId = (): string => {
    if (this.bundleId) return this.bundleId

    const id = DeviceInfo.getBundleId()
    this.bundleId = id

    return id
  }
}

export default new DeviceInfoService()
