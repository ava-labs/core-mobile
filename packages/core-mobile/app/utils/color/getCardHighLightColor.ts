import { AppTheme } from 'contexts/ApplicationContext'
import { Opacity70 } from 'resources/Constants'

export const getCardHighLightColor = (theme: AppTheme) => {
  return theme.colorBg3 + Opacity70
}
