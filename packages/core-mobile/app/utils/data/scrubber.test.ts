import { scrub } from './scrubber'

describe('data scrubber', () => {
  it('should mask auth key', () => {
    const input =
      'WebSocket connection failed for URL: wss://relay.walletconnect.com?auth=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaWQ6a2V5Ono2TWt2VVBaZjVKSFhEWTI5V3ZEWFVMb3kyM1hlZnBYUE5hUEJFU2h3OXU3emZRZiIsInN1YiI6IjQ5MjM4YzVjY2Q0MjM5ZjFkZjY5NjU4ODk4ZWQ3YjhhMTU3Yzk1ZmM0NWFhMTEzNTY4MzAwMzcyMTRmZDU3YmQiLCJhdWQiOiJ3c3M6Ly9yZWxheS53YWxsZXRjb25uZWN0LmNvbSIsImlhdCI6MTY4NjYwNDAxMywiZXhwIjoxNjg2NjkwNDEzfQ.5e_mDNhB5g6i0U3JRYizj6VMe6vSBfF5lspf35qD9Dds3JFJYfhTK9ZbJzp5DZQYFntxVwwh23tWA6pQ9V1PDQ&projectId=252fa1a3471f917bf5091b56b89416ca&ua=wc-2%2Fjs-2.3.2%2Funknown-%2Freact-native'
    const output =
      'WebSocket connection failed for URL: wss://relay.walletconnect.com?auth=***&projectId=252fa1a3471f917bf5091b56b89416ca&ua=wc-2%2Fjs-2.3.2%2Funknown-%2Freact-native'

    expect(scrub(input)).toStrictEqual(output)
  })

  it('should mask multiple auth keys', () => {
    const input =
      'WebSocket connection failed for URL: wss://relay.walletconnect.com?auth=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaWQ6a2V5Ono2TWt2VVBaZjVKSFhEWTI5V3ZEWFVMb3kyM1hlZnBYUE5hUEJFU2h3OXU3emZRZiIsInN1YiI6IjQ5MjM4YzVjY2Q0MjM5ZjFkZjY5NjU4ODk4ZWQ3YjhhMTU3Yzk1ZmM0NWFhMTEzNTY4MzAwMzcyMTRmZDU3YmQiLCJhdWQiOiJ3c3M6Ly9yZWxheS53YWxsZXRjb25uZWN0LmNvbSIsImlhdCI6MTY4NjYwNDAxMywiZXhwIjoxNjg2NjkwNDEzfQ.5e_mDNhB5g6i0U3JRYizj6VMe6vSBfF5lspf35qD9Dds3JFJYfhTK9ZbJzp5DZQYFntxVwwh23tWA6pQ9V1PDQ&projectId=252fa1a3471f917bf5091b56b89416ca&ua=wc-2%2Fjs-2.3.2%2Funknown-%2Freact-native&auth=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaWQ6a2V5Ono2TWt2VVBaZjVKSFhEWTI5V3ZEWFVMb3kyM1hlZnBYUE5hUEJFU2h3OXU3emZRZiIsInN1YiI6IjQ5MjM4YzVjY2Q0MjM5ZjFkZjY5NjU4ODk4ZWQ3YjhhMTU3Yzk1ZmM0NWFhMTEzNTY4MzAwMzcyMTRmZDU3YmQiLCJhdWQiOiJ3c3M6Ly9yZWxheS53YWxsZXRjb25uZWN0LmNvbSIsImlhdCI6MTY4NjYwNDAxMywiZXhwIjoxNjg2NjkwNDEzfQ.5e_mDNhB5g6i0U3JRYizj6VMe6vSBfF5lspf35qD9Dds3JFJYfhTK9ZbJzp5DZQYFntxVwwh23tWA6pQ9V1PDQ'
    const output =
      'WebSocket connection failed for URL: wss://relay.walletconnect.com?auth=***&projectId=252fa1a3471f917bf5091b56b89416ca&ua=wc-2%2Fjs-2.3.2%2Funknown-%2Freact-native&auth=***'

    expect(scrub(input)).toStrictEqual(output)
  })
})
