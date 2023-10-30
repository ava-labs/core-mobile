export {}
import { device } from 'detox'

beforeAll(async () => {
  // custom setup

  console.log('Initializing Detox')
  // await detox.init(config, { launchApp: false })
  await device.setURLBlacklist([
    'https://api.coingecko.com/api/v3/simple/price?ids=frax-ether%2Caragon%2Ctenset%2Cmerit-circle%2Ccreditcoin-2%2Cseth2%2Cpundi-x-2%2Clooksrare%2Ccoti%2Ctribe-2&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
    'https://data-posthog.avax-test.network/decide?v=2'
  ])
  await device.disableSynchronization()
})
