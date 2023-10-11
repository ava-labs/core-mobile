import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'

export const getPosthogDeviceInfo = async () => {
  return {
    $app_build: DeviceInfoService.getAppBuild(),
    $app_name: DeviceInfoService.getAppName(),
    $app_version: DeviceInfoService.getAppVersion(),
    $app_namespace: DeviceInfoService.getAppNameSpace(),
    $device_manufacturer: await DeviceInfoService.getDeviceManufacturer(),
    $device_model: DeviceInfoService.getDeviceModel(),
    $device_name: await DeviceInfoService.getDeviceName(),
    $device_type: await DeviceInfoService.getDeviceType(),
    $locale: DeviceInfoService.getLocale(),
    $network_carrier: await DeviceInfoService.getNetworkCarrier(),
    $os_name: await DeviceInfoService.getOperatingSystemName(),
    $os_version: await DeviceInfoService.getOperatingSystemVersion(),
    $timezone: DeviceInfoService.getTimezone()
  }
}
