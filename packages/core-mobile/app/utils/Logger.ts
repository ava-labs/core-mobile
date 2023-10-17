/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { format } from 'date-fns'

export enum LogLevel {
  TRACE = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const style = (color: string, bold = true) => {
  return `color:${color};font-weight:${bold ? '600' : '300'};font-size:11px`
}

const now = () => format(new Date(), '[HH:mm:ss.SS]')

const formatMessage = (message: string, color?: string) => {
  if (color) {
    return ['%c%s %s', style(color), now(), message]
  }

  return ['%s %s', now(), message]
}

class Logger {
  private level: LogLevel = LogLevel.ERROR

  setLevel = (level: LogLevel) => {
    this.level = level
  }

  shouldLog = (level: LogLevel) => {
    return level >= this.level
  }

  trace = (message: string, value?: any) => {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.groupCollapsed(...formatMessage(message, 'grey'))
      value && console.trace(value)
      console.groupEnd()
    }
  }

  info = (message: string, value?: any) => {
    if (this.shouldLog(LogLevel.INFO)) {
      message && console.info(...formatMessage(message))
      value && console.info(value)
    }
  }

  warn = (message: string, value?: any) => {
    if (this.shouldLog(LogLevel.WARN)) {
      console.groupCollapsed(...formatMessage(message, 'yellow'))
      value && console.warn(value)
      console.groupEnd()
    }
  }

  error = (message: string, value?: any) => {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.groupCollapsed(...formatMessage(message, 'red'))
      value && console.error(value)
      console.groupEnd()
    }
  }
}

export default new Logger()
