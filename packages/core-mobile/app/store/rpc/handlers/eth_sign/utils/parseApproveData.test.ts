import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import { primitiveTypedData, typedData } from 'tests/fixtures/rpc/typedData'
import { parseApproveData } from './parseApproveData'

const testParseInvalidApproveData = (data: unknown) => {
  const result = parseApproveData(data)
  expect(result.success).toEqual(false)
}

const testParseValidApproveData = (data: unknown) => {
  const result = parseApproveData(data)
  expect(result.success).toEqual(true)
  // @ts-expect-error data does exist
  expect(result.data.data).toEqual(data.data)
  // @ts-expect-error data does exist
  expect(result.data.network).toEqual(data.network)
  // @ts-expect-error data does exist
  expect(result.data.account).toEqual(data.account)
}

describe('parseApproveData', () => {
  it('should fail to parse when data is invalid', () => {
    const invalidDataScenarios = [
      null,
      {},
      { network: mockNetworks[43114] },
      { account: mockAccounts[0] },
      { data: '48656c6c6f2031323321' }
    ]

    for (const scenario of invalidDataScenarios) {
      testParseInvalidApproveData(scenario)
    }
  })

  it('should parse correctly when data is valid', () => {
    const testAccount = mockAccounts[0]
    const testNetwork = mockNetworks[43114]

    const validDataScenarios = [
      {
        data: {
          data: '48656c6c6f2031323321',
          account: testAccount,
          network: testNetwork
        }
      },
      {
        data: {
          data: primitiveTypedData,
          account: testAccount,
          network: testNetwork
        }
      },
      {
        data: {
          data: typedData,
          account: testAccount,
          network: testNetwork
        }
      }
    ]

    for (const scenario of validDataScenarios) {
      testParseValidApproveData(scenario.data)
    }
  })
})
