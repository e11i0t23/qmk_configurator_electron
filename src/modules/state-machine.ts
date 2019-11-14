import StateMachineC from 'javascript-state-machine';
import log from 'electron-log';

import {StateMachine, Transition, Methods} from './types';

const transitions: Transition[] = [];
const methods: Methods = {};

export function newStateMachine(): any {
  const fsm: StateMachine = new StateMachineC({
    init: 'waiting',
    ...transitions,
    ...methods,
  });

  log.info(fsm);
  return fsm;
}
