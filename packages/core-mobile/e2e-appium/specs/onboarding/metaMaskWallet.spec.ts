import warmup from '../../helpers/warmup'

describe('Onboarding', () => {
  it('Onboard a metamask wallet', async () => {
    await warmup(process.env.E2E_METAMASK_MNEMONIC as string)
  })
})
