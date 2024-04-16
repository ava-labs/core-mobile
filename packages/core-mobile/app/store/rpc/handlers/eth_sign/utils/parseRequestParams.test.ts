import { primitiveTypedData, typedData } from 'tests/fixtures/rpc/typedData'
import { parseRequestParams } from './parseRequestParams'

const testParseInvalidParams = (method: string, params: unknown) => {
  const result = parseRequestParams({
    method,
    params
  })

  expect(result.success).toEqual(false)
}

const testParseValidParams = ({
  method,
  params,
  parsedParams
}: {
  method: string
  params: unknown
  parsedParams: {
    address: string
    data: unknown
  }
}) => {
  const result = parseRequestParams({
    method,
    params
  })

  expect(result.success).toEqual(true)
  // @ts-expect-error data does exist
  expect(result.data.address).toEqual(parsedParams.address)
  // @ts-expect-error data does exist
  expect(result.data.data).toEqual(parsedParams.data)
}

describe('parseRequestParams', () => {
  describe('eth_sign', () => {
    it('should fail to parse when params are invalid', () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        ['48656c6c6f2031323321']
      ]

      for (const scenario of invalidParamsScenarios) {
        testParseInvalidParams('eth_sign', scenario)
      }
    })

    it('should parse correctly when params are valid', () => {
      testParseValidParams({
        method: 'eth_sign',
        params: [
          '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          '48656c6c6f2031323321'
        ],
        parsedParams: {
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: '48656c6c6f2031323321'
        }
      })
    })
  })

  describe('personal_sign', () => {
    it('should fail to parse when params are invalid', () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        ['hello message']
      ]

      for (const scenario of invalidParamsScenarios) {
        testParseInvalidParams('personal_sign', scenario)
      }
    })

    it('should parse correctly when params are valid', () => {
      const validParamsScenarios = [
        {
          params: [
            'hello message',
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: 'hello message'
        },
        {
          params: [
            'hello message',
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'some password'
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: 'hello message'
        }
      ]

      for (const scenario of validParamsScenarios) {
        const { params, address, data } = scenario
        testParseValidParams({
          method: 'personal_sign',
          params,
          parsedParams: { address, data }
        })
      }
    })
  })

  describe('eth_signTypedData', () => {
    it('should fail to parse when params are invalid', () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        [
          [
            {
              type: 'string',
              name: 'message',
              value: 'Hello Playground!'
            }
          ]
        ]
      ]

      for (const scenario of invalidParamsScenarios) {
        testParseInvalidParams('eth_signTypedData', scenario)
      }
    })

    it('should parse correctly when params are valid', () => {
      const validParamsScenarios = [
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            primitiveTypedData
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: primitiveTypedData
        },
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            JSON.stringify(primitiveTypedData)
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: primitiveTypedData
        },
        {
          params: ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', typedData],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        },
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            JSON.stringify(typedData)
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        }
      ]

      for (const scenario of validParamsScenarios) {
        const { params, address, data } = scenario
        testParseValidParams({
          method: 'eth_signTypedData',
          params,
          parsedParams: { address, data }
        })
      }
    })
  })

  describe('eth_signTypedData_v1', () => {
    it('should fail to parse when params are invalid', () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        [
          [
            {
              type: 'string',
              name: 'message',
              value: 'Hello Playground!'
            }
          ]
        ]
      ]

      for (const scenario of invalidParamsScenarios) {
        testParseInvalidParams('eth_signTypedData_v1', scenario)
      }
    })

    it('should parse correctly when params are valid', () => {
      const validParamsScenarios = [
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            primitiveTypedData
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: primitiveTypedData
        },
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            JSON.stringify(primitiveTypedData)
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: primitiveTypedData
        },
        {
          params: ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', typedData],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        },
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            JSON.stringify(typedData)
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        }
      ]

      for (const scenario of validParamsScenarios) {
        const { params, address, data } = scenario
        testParseValidParams({
          method: 'eth_signTypedData_v1',
          params,
          parsedParams: { address, data }
        })
      }
    })
  })

  describe('eth_signTypedData_v3', () => {
    it('should fail to parse when params are invalid', () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        [
          [
            {
              type: 'string',
              name: 'message',
              value: 'Hello Playground!'
            }
          ]
        ]
      ]

      for (const scenario of invalidParamsScenarios) {
        testParseInvalidParams('eth_signTypedData_v3', scenario)
      }
    })

    it('should parse correctly when params are valid', () => {
      const validParamsScenarios = [
        {
          params: ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', typedData],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        },
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            JSON.stringify(typedData)
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        }
      ]

      for (const scenario of validParamsScenarios) {
        const { params, address, data } = scenario
        testParseValidParams({
          method: 'eth_signTypedData_v3',
          params,
          parsedParams: { address, data }
        })
      }
    })
  })

  describe('eth_signTypedData_v4', () => {
    it('should fail to parse when params are invalid', () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        [
          [
            {
              type: 'string',
              name: 'message',
              value: 'Hello Playground!'
            }
          ]
        ]
      ]

      for (const scenario of invalidParamsScenarios) {
        testParseInvalidParams('eth_signTypedData_v4', scenario)
      }
    })

    it('should parse correctly when params are valid', () => {
      const validParamsScenarios = [
        {
          params: ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', typedData],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        },
        {
          params: [
            '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            JSON.stringify(typedData)
          ],
          address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          data: typedData
        }
      ]

      for (const scenario of validParamsScenarios) {
        const { params, address, data } = scenario
        testParseValidParams({
          method: 'eth_signTypedData_v4',
          params,
          parsedParams: { address, data }
        })
      }
    })
  })
})
