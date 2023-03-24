import DeviceInfo from 'react-native-device-info'

class DeviceInfoService {
  private appBuild?: string
  private appName?: string
  private appNamespace?: string
  private appVersion?: string
  private deviceId?: string
  private deviceManufacturer?: string
  private deviceModel?: string
  private deviceName?: string
  private deviceType?: string
  private networkCarrier?: string
  private operatingSystemName?: string
  private operatingSystemVersion?: string

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

  getDeviceId = async () => {
    if (this.deviceId) return this.deviceId

    const uniqueId = await DeviceInfo.getUniqueId()
    this.deviceId = uniqueId
    return uniqueId
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

  async getPosthogDeviceInfo() {
    const deviceInfo = {
      $app_build: this.getAppBuild(),
      $app_name: this.getAppName(),
      $app_version: this.getAppVersion(),
      $app_namespace: this.getAppNameSpace(),
      $device_id: await this.getDeviceId(),
      $device_manufacturer: await this.getDeviceManufacturer(),
      $device_model: this.getDeviceModel(),
      $device_name: await this.getDeviceName(),
      $device_type: await this.getDeviceType(),
      $network_carrier: await this.getNetworkCarrier(),
      $os_name: await this.getOperatingSystemName(),
      $os_version: await this.getOperatingSystemVersion()
    }

    return deviceInfo
  }
}

export default new DeviceInfoService()
