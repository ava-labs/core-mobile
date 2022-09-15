export type LoginAttempt = {
  count: number
  timestamp: number
}

export type SecurityState = {
  loginAttempt: LoginAttempt
}
