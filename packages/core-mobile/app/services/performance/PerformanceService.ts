import Logger from 'utils/Logger'

import { logger } from 'react-native-logs'

const NativeLogger = logger.createLogger()

// import AnalyticsService from 'services/analytics/AnalyticsService'

export enum PerformanceMilestone {
  APP_START = 'app_start',
  SPLASH_SCREEN_HIDDEN = 'splash_screen_hidden',
  UNLOCK_STARTED = 'unlock_started',
  UNLOCK_COMPLETED = 'unlock_completed',
  PORTFOLIO_LOADING_STARTED = 'portfolio_loading_started',
  PORTFOLIO_ASSETS_LOADED = 'portfolio_assets_loaded'
}

export interface PerformanceMetrics {
  splashHidden: number
  unlocking: {
    completed: number
    duration: number
  }
  portfolio: {
    completed: number
    loadingDuration: number
  }
}

class PerformanceService {
  private timingData: Map<PerformanceMilestone, number> = new Map()
  private sessionStartTime: number = Date.now()

  /**
   * Initialize performance tracking - should be called as early as possible in app lifecycle
   */
  init(): void {
    this.sessionStartTime = Date.now()
    this.recordMilestone(PerformanceMilestone.APP_START)
    Logger.trace('PerformanceService initialized')
  }

  /**
   * Record a performance milestone with current timestamp
   * Prevents duplicate recordings of the same milestone
   */
  recordMilestone(milestone: PerformanceMilestone): void {
    // Check if this milestone has already been recorded
    if (this.timingData.has(milestone)) {
      Logger.trace(
        `Performance milestone ${milestone} already recorded, skipping duplicate`
      )
      return
    }

    const timestamp = Date.now()
    this.timingData.set(milestone, timestamp)

    Logger.trace(
      `Performance milestone recorded: ${milestone} at ${new Date(
        timestamp
      ).getTime()}`
    )

    // Calculate and log relevant durations when certain milestones are reached
    this.calculateAndLogDurations(milestone)
  }

  /**
   * Get the time elapsed since a specific milestone
   */
  getTimeSinceMilestone(milestone: PerformanceMilestone): number | null {
    const milestoneTime = this.timingData.get(milestone)
    if (!milestoneTime) {
      return null
    }
    return Date.now() - milestoneTime
  }

  /**
   * Get the duration between two milestones
   */
  getDurationBetweenMilestones(
    startMilestone: PerformanceMilestone,
    endMilestone: PerformanceMilestone
  ): number | null {
    const startTime = this.timingData.get(startMilestone)
    const endTime = this.timingData.get(endMilestone)

    if (!startTime || !endTime) {
      return null
    }

    return endTime - startTime
  }

  /**
   * Calculate and log performance durations when specific milestones are reached
   */
  private calculateAndLogDurations(milestone: PerformanceMilestone): void {
    const appStartTime = this.timingData.get(PerformanceMilestone.APP_START)

    if (!appStartTime) {
      Logger.warn('App start time not recorded')
      return
    }

    switch (milestone) {
      case PerformanceMilestone.SPLASH_SCREEN_HIDDEN:
        this.logPerformanceMetric('App Start to Splash Hidden', appStartTime)
        break

      case PerformanceMilestone.UNLOCK_COMPLETED:
        this.logPerformanceMetric('App Start to Unlock Completed', appStartTime)
        this.logUnlockDuration()
        break

      case PerformanceMilestone.PORTFOLIO_ASSETS_LOADED:
        this.logPerformanceMetric('App Start to Portfolio Loaded', appStartTime)
        this.logPortfolioLoadingDuration()
        this.sendCompleteMetricsToAnalytics()
        break
    }
  }

  /**
   * Log unlock duration if both start and end milestones exist
   */
  private logUnlockDuration(): void {
    const duration = this.getDurationBetweenMilestones(
      PerformanceMilestone.UNLOCK_STARTED,
      PerformanceMilestone.UNLOCK_COMPLETED
    )

    if (duration !== null) {
      const durationSeconds = (duration / 1000).toFixed(3)
      Logger.trace(`🔓 Unlock Duration: ${durationSeconds}s`)
    }
  }

  /**
   * Log portfolio loading duration if both start and end milestones exist
   */
  private logPortfolioLoadingDuration(): void {
    const duration = this.getDurationBetweenMilestones(
      PerformanceMilestone.PORTFOLIO_LOADING_STARTED,
      PerformanceMilestone.PORTFOLIO_ASSETS_LOADED
    )

    if (duration !== null) {
      const durationSeconds = (duration / 1000).toFixed(3)
      Logger.trace(`📊 Portfolio Loading Duration: ${durationSeconds}s`)
    }
  }

  /**
   * Log a performance metric with duration from app start
   */
  private logPerformanceMetric(metricName: string, startTime: number): void {
    const durationMs = Date.now() - startTime
    const durationSeconds = (durationMs / 1000).toFixed(3)
    Logger.info(`⚡ ${metricName}: ${durationSeconds}s`)
  }

  /**
   * Send complete performance metrics to analytics when all milestones are reached
   */
  private sendCompleteMetricsToAnalytics(): void {
    const metrics = this.getCompleteMetrics()

    if (metrics) {
      Logger.info('📈 Complete Performance Metrics:', metrics)

      // Send performance metrics using react-native-logs
      NativeLogger.warn(
        `App Performance Metrics:
        
        Splash Hidden (isReady): ${metrics.splashHidden}s,
        Unlocking (duration): ${metrics.unlocking.duration}s,

        Unlocking (completed): ${metrics.unlocking.completed}s,
        Portfolio Loading (duration): ${metrics.portfolio.loadingDuration}s,
        Portfolio Loading (completed): ${metrics.portfolio.completed}s`
      )
    }
  }

  /**
   * Get complete performance metrics for all measured milestones
   */
  getCompleteMetrics(): PerformanceMetrics | null {
    const appStart = this.timingData.get(PerformanceMilestone.APP_START)
    const splashHidden = this.timingData.get(
      PerformanceMilestone.SPLASH_SCREEN_HIDDEN
    )
    const unlockCompleted = this.timingData.get(
      PerformanceMilestone.UNLOCK_COMPLETED
    )
    const portfolioLoaded = this.timingData.get(
      PerformanceMilestone.PORTFOLIO_ASSETS_LOADED
    )

    if (!appStart || !splashHidden || !unlockCompleted || !portfolioLoaded) {
      return null
    }

    const unlockDuration =
      this.getDurationBetweenMilestones(
        PerformanceMilestone.UNLOCK_STARTED,
        PerformanceMilestone.UNLOCK_COMPLETED
      ) || 0

    const portfolioLoadingDuration =
      this.getDurationBetweenMilestones(
        PerformanceMilestone.PORTFOLIO_LOADING_STARTED,
        PerformanceMilestone.PORTFOLIO_ASSETS_LOADED
      ) || 0

    return {
      splashHidden: (splashHidden - appStart) / 1000,
      unlocking: {
        completed: (unlockCompleted - appStart) / 1000,
        duration: unlockDuration / 1000
      },
      portfolio: {
        completed: (portfolioLoaded - appStart) / 1000,
        loadingDuration: portfolioLoadingDuration / 1000
      }
    }
  }

  /**
   * Reset all timing data (useful for testing or new sessions)
   */
  reset(): void {
    this.timingData.clear()
    this.sessionStartTime = Date.now()
    Logger.info('PerformanceService reset')
  }

  /**
   * Get current session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime
  }

  /**
   * Get all recorded milestones for debugging
   */
  getAllMilestones(): Record<string, number> {
    const result: Record<string, number> = {}
    this.timingData.forEach((timestamp, milestone) => {
      result[milestone] = timestamp
    })
    return result
  }
}

// Export singleton instance
export default new PerformanceService()
