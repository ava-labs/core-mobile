import { test } from '@playwright/test'
import {
  getCurrentContext,
  playwrightSetup
} from '../../../../helpers/playwrightSetup'
import actions from '../../../../helpers/playwrightActions'
import delay from '../../../../helpers/waits'

const rpc = {
  ETH_SEND_TRANSACTION: 'eth_sendTransaction',
  SIGN_TYPED_DATA_V3: 'eth_signTypedData_v3',
  SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
  SIGN_TYPED_DATA: 'eth_signTypedData',
  PERSONAL_SIGN: 'personal_sign',
  ETH_SIGN: 'eth_sign'
}

test.describe.serial('Ethereum RPC Tests', () => {
  // eslint-disable-next-line no-empty-pattern
  test.afterEach(async ({}, testInfo) => {
    console.log('testInfo.title: ', testInfo.title)
    actions.addTestResultToFile(
      testInfo.title,
      testInfo.status === 'passed' ? 'PASS' : 'FAIL',
      'playwright',
      './e2e/tests/dapps/playwright/playground/playwrightResults.json'
    )
  })

  test.beforeAll(async () => {
    const { playground } = await playwrightSetup(true)
    await playground.connect()
  })

  test(`${rpc.ETH_SEND_TRANSACTION}`, async () => {
    const { playground } = await getCurrentContext()
    await playground.sendRpcCall(rpc.ETH_SEND_TRANSACTION)
    await delay(5000)
  })

  test(`${rpc.SIGN_TYPED_DATA_V3}`, async () => {
    const { playground } = await getCurrentContext()
    await playground.sendRpcCall(rpc.SIGN_TYPED_DATA_V3)
  })

  test(`${rpc.SIGN_TYPED_DATA_V4}`, async () => {
    const { playground } = await getCurrentContext()
    await playground.sendRpcCall(rpc.SIGN_TYPED_DATA_V4)
  })

  test(`${rpc.SIGN_TYPED_DATA}`, async () => {
    const { playground } = await getCurrentContext()
    await playground.sendRpcCall(rpc.SIGN_TYPED_DATA)
  })

  test(`${rpc.PERSONAL_SIGN}`, async () => {
    const { playground } = await getCurrentContext()
    await playground.sendRpcCall(rpc.PERSONAL_SIGN)
  })

  test(`${rpc.ETH_SIGN}`, async () => {
    const { playground } = await getCurrentContext()
    await playground.sendRpcCall(rpc.ETH_SIGN)
  })
})
