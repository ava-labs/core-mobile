import { useApplicationContext } from 'contexts/ApplicationContext'

export const useSkeletonColors = () => {
  const { theme } = useApplicationContext()
  const backgroundColor = theme.colorBg2
  const foregroundColor = '#2A2A2D'

  return { backgroundColor, foregroundColor }
}
