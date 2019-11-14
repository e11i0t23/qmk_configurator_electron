import StateMachineC from 'javascript-state-machine';
import log from 'electron-log';

import {StateMachine, Methods, Options} from './types';
import transitions from './transitions';
import {WAITING} from './transitions';

const methods: Methods = {};

const options: Options = {
  name: 'flashStateMachine',
  init: WAITING,
  transitions,
  methods,
};

export function newStateMachine(): any {
  const fsm: StateMachine = new StateMachineC(options);

  log.info(fsm);
  return fsm;
}
