import { hasRouteByName } from './hasRouteByName'

type NavState = {
  routes?: Array<{ name?: string; state?: NavState }>
}

describe('hasRouteByName', () => {
  it('should return false if state is undefined', () => {
    expect(hasRouteByName(undefined, '(signedIn)')).toBe(false)
  })

  it('should return false if state has no routes', () => {
    const state: NavState = {}
    expect(hasRouteByName(state, '(signedIn)')).toBe(false)
  })

  it('should return true if target route is at the root level', () => {
    const state: NavState = {
      routes: [{ name: '(signedIn)' }, { name: 'home' }]
    }
    expect(hasRouteByName(state, '(signedIn)')).toBe(true)
  })

  it('should return true if target route is nested', () => {
    const state: NavState = {
      routes: [
        {
          name: 'root',
          state: {
            routes: [{ name: 'dashboard' }, { name: '(signedIn)' }]
          }
        }
      ]
    }
    expect(hasRouteByName(state, '(signedIn)')).toBe(true)
  })

  it('should return false if target route does not exist', () => {
    const state: NavState = {
      routes: [{ name: 'root', state: { routes: [{ name: 'dashboard' }] } }]
    }
    expect(hasRouteByName(state, '(signedIn)')).toBe(false)
  })

  it('should return true if deeply nested route matches', () => {
    const state: NavState = {
      routes: [
        {
          name: 'root',
          state: {
            routes: [
              {
                name: 'level1',
                state: {
                  routes: [
                    {
                      name: 'level2',
                      state: {
                        routes: [{ name: '(signedIn)' }]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
    expect(hasRouteByName(state, '(signedIn)')).toBe(true)
  })
})
