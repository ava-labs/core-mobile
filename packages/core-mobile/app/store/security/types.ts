export type LoginAttempt = {
  count: number
  countdown: number
}

export type SecurityState = {
  loginAttempt: LoginAttempt
}
