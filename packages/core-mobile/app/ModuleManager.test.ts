import { ModuleManager } from 'ModuleManager'

describe('ModuleManager', () => {
  it('should load the correct modules', async () => {
    const moduleManager = new ModuleManager()
    const params = [
      {
        chainId: 'eip155:1',
        method: 'eth_randomMethod'
      },
      {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        method: 'bitcoin_randomMethod'
      },
      {
        chainId: 'avax:2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
        method: 'avalanche_randomMethod'
      },
      {
        chainId: 'avax:11111111111111111111111111111111LpoYY',
        method: 'avalanche_randomMethod'
      },
      {
        chainId: 'eip2256:1',
        method: 'eth_randomMethod'
      }
    ]
    params.forEach(async param => {
      const module = await moduleManager.loadModule(param.chainId, param.method)
      expect(module?.getManifest()?.network.chainIds).toContain(param.chainId)
    })
  })

  it('should have thrown with incorrect method', async () => {
    const moduleManager = new ModuleManager()
    try {
      await moduleManager.loadModule('eip155:1', 'evth_randomMethod')
    } catch (e) {
      expect((e as Error).message).toBe(
        'Method evth_randomMethod is not supported in EVM module'
      )
    }
  })
  it('should have thrown with incorrect namespace', async () => {
    const moduleManager = new ModuleManager()
    try {
      await moduleManager.loadModule('cip155:1', 'eth_method')
    } catch (e) {
      expect((e as Error).message).toBe(
        'No module supported for chainId: cip155:1'
      )
    }
  })
})
