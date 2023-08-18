import { DatadogProviderConfiguration } from '@datadog/mobile-react-native'

const DD_CLIENT_TOKEN = process.env.DD_CLIENT_TOKEN
const ENVIRONMENT = process.env.ENVIRONMENT
const DD_APPLICATION_ID = process.env.DD_APPLICATION_ID
const DD_SITE = process.env.DD_SITE

if (!DD_CLIENT_TOKEN || !ENVIRONMENT || !DD_APPLICATION_ID || !DD_SITE) {
  throw new Error('DataDog credentials must be provided')
}

const DataDogConfig = new DatadogProviderConfiguration(
  DD_CLIENT_TOKEN,
  ENVIRONMENT,
  DD_APPLICATION_ID,
  true,
  true,
  true
)

DataDogConfig.site = DD_SITE
DataDogConfig.nativeCrashReportEnabled = true
DataDogConfig.sessionSamplingRate = 80
DataDogConfig.resourceTracingSamplingRate = 80

export default DataDogConfig
