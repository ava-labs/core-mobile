import { convertSnakeToCamel } from './convertSnakeToCamel'

describe('convertSnakeToCamel', () => {
  const mockJson = {
    test_key: 'test_value',
    test_2key: 'test_value2',
    test_3key: {
      test_3sub_key: 'test_3sub_value',
      test_3sub_key2: 'test_3sub_value2',
      test_3sub_key3: {
        test_3sub_sub_key: 'test_3sub_sub_value',
        test_3sub_sub_key2: 'test_3sub_sub_value2',
        test_3sub_sub_key3: [
          {
            test_3sub_sub_sub_key: 'test_3sub_sub_sub_value',
            test_3sub_sub_sub_key2: 'test_3sub_sub_sub_value2'
          },
          {
            test_3sub_sub_sub_key: 'test_3sub_sub_sub_value',
            test_3sub_sub_sub_key2: 'test_3sub_sub_sub_value2'
          }
        ]
      }
    }
  }

  it('should have returned json in camel case', () => {
    const result = convertSnakeToCamel(mockJson)
    expect(result).toStrictEqual({
      testKey: 'test_value',
      test2key: 'test_value2',
      test3key: {
        test3subKey: 'test_3sub_value',
        test3subKey2: 'test_3sub_value2',
        test3subKey3: {
          test3subSubKey: 'test_3sub_sub_value',
          test3subSubKey2: 'test_3sub_sub_value2',
          test3subSubKey3: [
            {
              test3subSubSubKey: 'test_3sub_sub_sub_value',
              test3subSubSubKey2: 'test_3sub_sub_sub_value2'
            },
            {
              test3subSubSubKey: 'test_3sub_sub_sub_value',
              test3subSubSubKey2: 'test_3sub_sub_sub_value2'
            }
          ]
        }
      }
    })
  })
})
