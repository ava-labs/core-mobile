export {}
import sendResults from './sendResults'

afterAll(async () => {
  if (process.env.POST_TO_TESTRAIL === 'true') {
    await sendResults()
  }
})
