import { useFonts } from 'expo-font'

export const useLoadFonts = (): { loaded: boolean; error: Error | null } => {
  const [loaded, error] = useFonts({
    'Aeonik-Bold': require('assets/fonts/Aeonik-Bold.otf'),
    'Aeonik-Medium': require('assets/fonts/Aeonik-Medium.otf'),
    DejaVuSansMono: require('assets/fonts/DejaVuSansMono.ttf'),
    'Inter-Regular': require('assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('assets/fonts/Inter-Bold.ttf')
  })

  return { loaded, error }
}
