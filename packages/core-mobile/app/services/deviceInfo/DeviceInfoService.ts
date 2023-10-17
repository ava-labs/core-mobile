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

  getAppBuild = () => {
    if (this.appBuild) return this.appBuild

    const build = DeviceInfo.getBuildNumber()
    this.appBuild = build
    return build
  }

  getAppName = () => {
    if (this.appName) return this.appName

    const applicationName = DeviceInfo.getApplicationName()
    this.appName = applicationName
    return applicationName
  }

  getAppNameSpace = () => {
    if (this.appNamespace) return this.appNamespace

    const space = DeviceInfo.getBundleId()
    this.appNamespace = space
    return space
  }

  getAppVersion = () => {
    if (this.appVersion) return this.appVersion

    const version = DeviceInfo.getVersion()
    this.appVersion = version
    return version
  }

  getDeviceManufacturer = async () => {
    if (this.deviceManufacturer) return this.deviceManufacturer

    const manufacturer = await DeviceInfo.getManufacturer()
    this.deviceManufacturer = manufacturer
    return manufacturer
  }

  getDeviceModel = () => {
    if (this.deviceModel) return this.deviceModel

    const model = DeviceInfo.getDeviceId()
    this.deviceModel = model
    return model
  }

  getDeviceName = async () => {
    if (this.deviceName) return this.deviceName

    const name = await DeviceInfo.getDeviceName()
    this.deviceName = name
    return name
  }

  getDeviceType = async () => {
    if (this.deviceType) return this.deviceType

    const type = DeviceInfo.getSystemName()
    this.deviceType = type
    return type
  }

  getOperatingSystemName = async () => {
    if (this.operatingSystemName) return this.operatingSystemName

    const systemName = await DeviceInfo.getSystemName()
    this.operatingSystemName = systemName
    return systemName
  }

  getOperatingSystemVersion = async () => {
    if (this.operatingSystemVersion) return this.operatingSystemVersion

    const systemVersion = await DeviceInfo.getSystemVersion()
    this.operatingSystemVersion = systemVersion
    return systemVersion
  }

  getNetworkCarrier = async () => {
    if (this.networkCarrier) return this.networkCarrier

    const carrier = await DeviceInfo.getCarrier()
    this.networkCarrier = carrier
    return carrier
  }

  getLocale = () => {
    if (this.locale) return this.locale

    const preferredLocal = getLocales()[0]?.languageTag
    this.locale = preferredLocal
    return preferredLocal
  }

  getTimezone = () => {
    if (this.timezone) return this.timezone

    const time = getTimeZone()
    this.timezone = time
    return time
  }
}

export default new DeviceInfoService()
