import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity70 } from 'resources/Constants'

export const useSkeletonColors = () => {
  const { theme } = useApplicationContext()
  const backgroundColor = theme.colorBg2
  const foregroundColor = theme.colorBg3 + Opacity70

  return { backgroundColor, foregroundColor }
}
