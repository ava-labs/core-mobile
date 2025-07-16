import { warmup } from '../../../helpers/warmup'
import pl from '../../../locators/portfolio.loc'
import bridgePage from '../../../pages/bridge.page'
import cl from '../../../locators/commonEls.loc'

// Please note that the tests here are NOT for completing the bridge transactions,
// but for verifying the bridge screen and its elements'
// Since Bridge Transactions are expensive, we are just testing the flow between networks on e2e daily run.
// we can add `true` to bridgePage.bridge() to complete the bridge transaction.
describe('Bridge to C-Chain', () => {
  beforeAll(async () => {
    await warmup()
  })

  // Bitcoin > C-Chain
  it(`should bridge from Bitcoin to C-Chain`, async () => {
    await bridgePage.bridge(
      pl.btcNetwork,
      'BTC',
      '0.0013',
      cl.btcAddress,
      cl.myBtcAddress
    )
  })
})
