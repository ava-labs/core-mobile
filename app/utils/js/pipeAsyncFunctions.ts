/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * from https://www.30secondsofcode.org/js/s/pipe-async-functions
 * Performs left-to-right function composition for asynchronous functions.
 *
 * Use Array.prototype.reduce() and the spread operator (...) to perform function composition using Promise.prototype.then().
 * The functions can return a combination of normal values, Promises or be async, returning through await.
 * All functions must accept a single argument.
 */
export const pipeAsyncFunctions =
  (...fns: { (data: any): any }[]) =>
  (arg: any) =>
    fns.reduce((p, f) => p.then(f), Promise.resolve(arg))
