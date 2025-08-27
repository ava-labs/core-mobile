/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import tp from '../../pages/track.page'

describe('Track', () => {
  beforeAll(async () => {
    await warmup()
  })

  const favorites = ['Avalanche', 'Bitcoin', 'Ethereum']
  const newToken = 'XRP'

  it('should have default favorite tokens on Track', async () => {
    await tp.goToFavorites()
    await tp.verifyFavorites(favorites)
  })

  it('should add a new favorite token to Track', async () => {
    // Add token to favorite list
    favorites.push(newToken)
    await tp.addFavoriteToken(newToken)
    await tp.verifyFavorites(favorites)
  })

  it('should remove a token from Track tab', async () => {
    // Remove token from favorite list
    favorites.pop()
    await tp.removeFavoriteToken(newToken)
    await tp.verifyFavorites(favorites)
  })
})
