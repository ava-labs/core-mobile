/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { format } from 'date-fns'
import { TextInput } from 'react-native'
import SentryService from 'services/sentry/SentryService'
import { assertNotNull } from 'utils/assertions'

export enum LogLevel {
  TRACE = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const style = (color: string, bold = true): string => {
  return `color:${color};font-weight:${bold ? '600' : '300'};font-size:11px`
}

const now = (): string => format(new Date(), '[HH:mm:ss.SS]')

const formatMessage = (
  message: string,
  color?: string
): [string, string, string, string] | [string, string, string] => {
  if (color) {
    return ['%c%s %s', style(color), now(), message]
  }

  return ['%s %s', now(), message]
}

class Logger {
  private textRef: TextInput | null
  private textRefBuffer = ''
  private level: LogLevel = LogLevel.ERROR
  private shouldLogErrorToSentry = false

  setLevel = (level: LogLevel): void => {
    this.level = level
  }

  shouldLog = (level: LogLevel): boolean => {
    return level >= this.level
  }

  trace = (message: string, value?: any): void => {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.groupCollapsed(...formatMessage(message, 'grey'))
      console.trace(message, value ?? '')
      console.groupEnd()
    }
  }

  info = (message: string, value?: any): void => {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(...formatMessage(message))
      console.info(message, value ?? '')
    }
  }

  warn = (message: string, value?: any): void => {
    if (this.shouldLog(LogLevel.WARN)) {
      console.groupCollapsed(...formatMessage(message, 'yellow'))
      console.warn(message, value ?? '')
      console.groupEnd()
    }
  }

  error = (message: string, value?: any): void => {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.groupCollapsed(...formatMessage(message, 'red'))
      console.error(message, value ?? '')
      console.groupEnd()

      if (this.shouldLogErrorToSentry) {
        SentryService.captureException(message, value)
      }
    }
  }

  /**
   * Log message to TextInput view. First set view with {@link showOnScreen}
   */
  screen = (message: string): void => {
    this.textRefBuffer += '\n' + message
    if (this.textRefBuffer.length > 10000) {
      this.textRefBuffer = this.textRefBuffer.slice(
        this.textRefBuffer.length - 10000
      )
    }
    this.printToScreen(this.textRefBuffer)
  }

  /**
   * Set TextInput view to which will logs output. {@link screen}
   * Example:
   *   const textRef = createRef<TextInput>()
   *
   *   useEffect(() => {
   *     Logger.showOnScreen(textRef.current)
   *   }, [textRef])
   *
   *   ...
   *   <TextInput
   *     ref={textRef}
   *     editable={false}
   *     multiline={true}
   *     style={{
   *       position: 'absolute',
   *       top: 40,
   *       end: 0,
   *       color: 'white',
   *       width: 300,
   *       height: 50,
   *     }}
   *   />
   *   ...
   */
  showOnScreen = (screen: TextInput | null): void => {
    this.textRef = screen
  }

  private printToScreen = (message: string): void => {
    assertNotNull(
      this.textRef,
      'You must set TextInput ref with Logger.showOnScreen()'
    )
    this.textRef.setNativeProps({
      text: (this.textRef.props.value ?? '') + '\n' + message
    })
  }

  setShouldLogErrorToSentry = (shouldLogErrorToSentry: boolean): void => {
    this.shouldLogErrorToSentry = shouldLogErrorToSentry
  }
}

export default new Logger()
