import { AppTheme } from 'contexts/ApplicationContext'
import { StakeTypeEnum } from './StakeDashboard'

export const getStakePrimaryColor = (type: string, theme: AppTheme) => {
  switch (type) {
    case StakeTypeEnum.Available:
      return theme.blueDark
    case StakeTypeEnum.Claimable:
      return theme.neutralSuccessLight
    default:
      return theme.white
  }
}

export const getStakeShadowColor = (type: string, theme: AppTheme) => {
  switch (type) {
    case StakeTypeEnum.Available:
      return theme.colorPrimary1
    case StakeTypeEnum.Claimable:
      return theme.colorSuccess
    default:
      return theme.pieChartWhiteStroke
  }
}
