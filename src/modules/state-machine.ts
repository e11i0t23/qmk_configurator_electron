import StateMachineC from 'javascript-state-machine';
import log from 'electron-log';

import {StateMachine, Options} from './types';
import transitions from './transitions';
import {WAITING} from './transitions';

const debug = false;

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
    validator: function(): PromiseLike<boolean | Error> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with erasing function
    eraser: function(): PromiseLike<boolean | Error> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with flasher function
    flasher: function(): PromiseLike<boolean | Error> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with restarter function
    restarter: function(): PromiseLike<boolean | Error> {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
    // Override this with restarter function
    failer: function(result: any): void {
      console.log(result);
    },
    succeeder: function(result: any): void {
      console.log(result);
    },
    onEnterValidating: function(): PromiseLike<boolean | Error> {
      const errored = this.errored.bind(this);
      const validated = this.validated.bind(this);
      return this.validator()
        .then(() => {
          setTimeout(validated, 0);
        })
        .catch(() => {
          this.error = 'Unsupported bootloader';
          setTimeout(errored, 0);
        }) as PromiseLike<boolean | Error>;
    },
    onEnterErasing: function(): PromiseLike<boolean | Error> {
      debug && console.log('erase runs now');
      const erased = this.erased.bind(this);
      const errored = this.errored.bind(this);
      return this.eraser()
        .then(() => {
          debug && console.log('erased');
          setTimeout(erased, 0);
        })
        .catch((err: string) => {
          this.error = new Error(err);
          setTimeout(errored, 0);
          console.log('crashed', err);
        });
    },
    onEnterFlashing: function(): PromiseLike<boolean | Error> {
      debug && console.log('flash runs now');
      const errored = this.errored.bind(this);
      const flashed = this.flashed.bind(this);
      return this.flasher()
        .then(() => {
          debug && console.log('flashed');
          setTimeout(flashed, 0);
        })
        .catch((err: string) => {
          setTimeout(errored, 0);
          this.error = new Error(err);
          console.log('crashed', err);
        });
    },
    onEnterRestarting: function(): PromiseLike<boolean | Error> {
      debug && console.log('restarting');
      const restarted = this.restarted.bind(this);
      const errored = this.errored.bind(this);
      return this.restarter()
        .then(() => {
          debug && console.log('restarted');
          setTimeout(restarted, 0);
        })
        .catch((err: string) => {
          setTimeout(errored, 0);
          this.error = new Error(err);
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
