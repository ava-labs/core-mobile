export {}
import sendResults from './sendResults'

afterAll(async () => {
  await sendResults()
})
