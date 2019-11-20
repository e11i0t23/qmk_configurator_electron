import * as childProcess from 'child_process';

const timerTimeout = 10000;

export class TimedOutError extends Error {
  constructor(...params: any) {
    super(...params);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimedOutError);
    }

    this.name = 'TimedOutError';
  }
}

export function timeoutBuilder(
  reject: (value?: boolean | Error | PromiseLike<boolean | Error>) => void,
  spawner: childProcess.ChildProcess,
  errMsg: string
): number {
  return window.setTimeout(function timeoutError() {
    spawner.kill();
    reject(new TimedOutError(errMsg));
  }, timerTimeout);
}

export function responseAdapter(
  fn: Promise<unknown>,
  successMsg: string,
  failMsg: unknown
): Promise<any> {
  return fn
    .then((r) => {
      window.Bridge.statusAppend(successMsg);
      return r;
    })
    .catch((r) => {
      window.Bridge.statusAppend(
        typeof failMsg === 'function' ? failMsg(r) : failMsg
      );
      return r;
    }) as Promise<unknown>;
}
