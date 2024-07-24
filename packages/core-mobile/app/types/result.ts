export type Result<Value, E extends Error = Error> =
  | {
      success: true
      value: Value
    }
  | {
      success: false
      error: E
    }
