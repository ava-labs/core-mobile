/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import tp from '../../pages/track.page'
import commonElsPage from '../../pages/commonEls.page'
import bottomTabsPage from '../../pages/bottomTabs.page'

describe('Track', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify top trending token detail', async () => {
    await bottomTabsPage.tapTrackTab()
    await tp.verifyTopTrendingToken()
    const [name, symbol, value] = await tp.getTopToken()
    await tp.tapTrendingToken()
    await tp.verifyTokenDetailHeader(name ?? '', symbol ?? '', value ?? '')
    await commonElsPage.dismissBottomSheet()
  })

  it('should swap on track', async () => {
    await tp.swap()
    await commonElsPage.verifySuccessToast()
  })

  it('should swap on token detail', async () => {
    await tp.swap(false)
    await commonElsPage.verifySuccessToast()
    await commonElsPage.dismissBottomSheet()
  })

  it('should verify trending tokens', async () => {
    await tp.verifyTrendingTokens()
  })
})
