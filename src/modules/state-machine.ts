import StateMachineC from 'javascript-state-machine';
import log from 'electron-log';

import {StateMachine, Options, ResponseNeeded, StateMachineRet} from './types';
import transitions from './transitions';
import {WAITING} from './transitions';
import {bindAndRunNextTick} from './programmers/utils';

const debug = true;

const defaultOptions: Options = {
  name: 'flashStateMachine',
  init: WAITING,
  transitions,
  data: (): {error: Error} => {
    return {
      error: undefined,
    };
  },
  methods: {
    // Override this with erasing function
    validator: function(): PromiseLike<StateMachineRet> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with erasing function
    eraser: function(): PromiseLike<StateMachineRet> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with flasher function
    flasher: function(): PromiseLike<StateMachineRet> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with restarter function
    restarter: function(): PromiseLike<StateMachineRet> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    failer(): PromiseLike<StateMachineRet> {
      return new Promise((resolve, reject) => {
        window.Bridge.statusAppend(`Flash Failed. ${this.error}`);
        reject(this.error);
      });
    },
    succeeder(): PromiseLike<StateMachineRet> {
      return new Promise((resolve) => {
        window.Bridge.statusAppend('Flash Succeeded. Enjoy your new keymap');
        resolve(true);
      });
    },
    onEnterValidating: function(): PromiseLike<StateMachineRet> {
      const errored = bindAndRunNextTick(this, this.errored);
      const timedOut = bindAndRunNextTick(this, this.timedOut);
      const validated = bindAndRunNextTick(this, this.validated);
      return this.validator()
        .then((r: boolean | ResponseNeeded | Error) => {
          if (r) {
            validated();
          } else {
            this.error = r;
            if (r instanceof Error && r.name === 'TimedOutError') {
              timedOut();
            } else {
              errored();
            }
          }
          return r;
        })
        .catch((r: StateMachineRet) => {
          this.error = 'Unsupported bootloader';
          errored();
          return r;
        });
    },
    onEnterErasing: function(): PromiseLike<StateMachineRet> {
      debug && console.log('erase runs now');
      const erased = bindAndRunNextTick(this, this.erased);
      const timedOut = bindAndRunNextTick(this, this.timedOut);
      const errored = bindAndRunNextTick(this, this.errored);
      return this.eraser()
        .then((r: StateMachineRet) => {
          debug && console.log('erased');
          if (r) {
            erased();
          } else {
            this.error = r;
            if (r instanceof Error && r.name === 'TimedOutError') {
              timedOut();
            } else {
              errored();
            }
          }
          return r;
        })
        .catch((err: string) => {
          this.error = err;
          errored();
          console.log('crashed', err);
        });
    },
    onEnterFlashing: function(): PromiseLike<StateMachineRet> {
      debug && console.log('flash runs now');
      const errored = bindAndRunNextTick(this, this.errored);
      const flashed = bindAndRunNextTick(this, this.flashed);
      const timedOut = bindAndRunNextTick(this, this.timedOut);
      return this.flasher()
        .then((r: StateMachineRet) => {
          debug && console.log('flashed');
          if (r) {
            flashed();
          } else {
            this.error = r;
            if (r instanceof Error && r.name === 'TimedOutError') {
              timedOut();
            } else {
              errored();
            }
          }
          return r;
        })
        .catch((err: string) => {
          this.error = err;
          errored();
          console.log('crashed', err);
        });
    },
    onEnterRestarting: function(): PromiseLike<StateMachineRet> {
      debug && console.log('restarting');
      const restarted = bindAndRunNextTick(this, this.restarted);
      const errored = bindAndRunNextTick(this, this.errored);
      const timedOut = bindAndRunNextTick(this, this.timedOut);
      return this.restarter()
        .then((r: StateMachineRet) => {
          debug && console.log('restarted');
          if (r) {
            restarted();
          } else {
            this.error = r;
            if (r instanceof Error && r.name === 'TimedOutError') {
              timedOut();
            } else {
              errored();
            }
          }
        })
        .catch((err: string) => {
          this.error = err;
          errored();
          console.log('crashed', err);
        });
    },
    onEnterFailed: function(): void {
      this.failer();
      debug && console.log('failed', this.error);
    },
    onEnterSuccess: function(): void {
      this.succeeder('success');
      debug && console.log('>>>>> we did it reddit <<<<<');
    },
    onTransition: function(lifecycle, arg1, arg2): boolean {
      if (debug) {
        console.log('event ', lifecycle.transition); // 'step'
        console.log('state from ', lifecycle.from); // 'A'
        console.log('state to ', lifecycle.to); // 'B'
        console.log(arg1); // 42
        console.log(arg2); // 'hello'
      }
      return true;
    },
  },
};

export function newStateMachine(opts: Options = {}): StateMachine {
  const fsm: StateMachine = new StateMachineC({
    ...defaultOptions,
    methods: {...defaultOptions.methods, ...opts.methods},
  });
  debug && log.info(fsm);
  return fsm;
}
