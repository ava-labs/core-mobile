import seedlessPage from '../pages/seedless.page'

export default async function warmupSeedless() {
  await seedlessPage.completeSeedlessOnboarding()
}
