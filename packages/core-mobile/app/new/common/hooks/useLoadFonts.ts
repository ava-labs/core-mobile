import { useFonts } from 'expo-font'

export const useLoadFonts = (): { loaded: boolean; error: Error | null } => {
  const [loaded, error] = useFonts({
    'Aeonik-Bold': require('assets/fonts/Aeonik-Bold.otf'),
    'Aeonik-Medium': require('assets/fonts/Aeonik-Medium.otf'),
    DejaVuSansMono: require('assets/fonts/DejaVuSansMono.ttf'),
    'Inter-Regular': require('assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('assets/fonts/Inter-Bold.ttf'),
    // Motorola Rookery — limited-mode brand typeface. Mapped onto the
    // motoText variant in k2-alpine; falls back to Inter automatically
    // if any weight is missing on a device.
    'Rookery-Regular': require('assets/fonts/Rookery-Regular.otf'),
    'Rookery-Medium': require('assets/fonts/Rookery-Medium.otf'),
    'Rookery-Bold': require('assets/fonts/Rookery-Bold.otf')
  })

  return { loaded, error }
}
