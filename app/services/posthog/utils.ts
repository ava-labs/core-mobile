import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'

export const getPosthogDeviceInfo = async () => {
  const deviceInfo = {
    $app_build: DeviceInfoService.getAppBuild(),
    $app_name: DeviceInfoService.getAppName(),
    $app_version: DeviceInfoService.getAppVersion(),
    $app_namespace: DeviceInfoService.getAppNameSpace(),
    $device_id: await DeviceInfoService.getDeviceId(),
    $device_manufacturer: await DeviceInfoService.getDeviceManufacturer(),
    $device_model: DeviceInfoService.getDeviceModel(),
    $device_name: await DeviceInfoService.getDeviceName(),
    $device_type: await DeviceInfoService.getDeviceType(),
    $network_carrier: await DeviceInfoService.getNetworkCarrier(),
    $os_name: await DeviceInfoService.getOperatingSystemName(),
    $os_version: await DeviceInfoService.getOperatingSystemVersion()
  }

  return deviceInfo
}
