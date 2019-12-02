import * as childProcess from 'child_process';
import {StateMachineRet, Response} from '../types';

const timerTimeout = 10000;

export class TimedOutError extends Error {
  // eslint-disable-next-line
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
  reject: (value?: StateMachineRet | PromiseLike<StateMachineRet>) => void,
  spawner: childProcess.ChildProcess,
  errMsg: string,
  duration: number = timerTimeout
): number {
  return window.setTimeout(function timeoutError() {
    spawner.kill();
    reject(new TimedOutError(errMsg));
  }, duration);
}

export function responseAdapter(
  loggerFn: (msg: string) => void,
  fn: Promise<StateMachineRet>,
  successMsg: string,
  failMsg: unknown
): Promise<StateMachineRet> {
  return fn
    .then((r) => {
      loggerFn(`${successMsg}\n`);
      return r;
    })
    .catch((r) => {
      loggerFn(`${typeof failMsg === 'function' ? failMsg(r) : failMsg}\n`);
      return r;
    });
}

export function bindAndRunNextTick(self: unknown, fn: Function): Function {
  return (): void => {
    setTimeout(fn.bind(self), 0);
  };
}

export function instanceOfResponse(object: any): object is Response {
  return object.kind === 'response';
}
