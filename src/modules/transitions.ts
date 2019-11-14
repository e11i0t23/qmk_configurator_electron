import {Transition} from './types';

// EVENTS
export const EV_READY = 'READY';
export const EV_TIMED_OUT = 'TIMED-OUT';
export const EV_ERRORED = 'ERROED';
export const EV_ERASED = 'ERASED';
export const EV_FLASHED = 'FLASHED';
export const EV_RESTARTED = 'RESTARTED';

// STATES
export const WAITING = 'WAITING';
export const ERASING = 'ERASING';
export const FLASHING = 'FLASHING';
export const RESTARTING = 'RESTARTING';
export const FAILED = 'FAILED';
export const SUCCESS = 'SUCCESS';

const transitions: Transition[] = [
  {
    name: EV_READY,
    from: WAITING,
    to: ERASING,
  },
  {
    name: EV_TIMED_OUT,
    from: [WAITING, ERASING, FLASHING, RESTARTING],
    to: FAILED,
  },
  {
    name: EV_ERRORED,
    from: [WAITING, ERASING, FLASHING, RESTARTING],
    to: FAILED,
  },
  {
    name: EV_ERASED,
    from: ERASING,
    to: FLASHING,
  },
  {
    name: EV_FLASHED,
    from: FLASHING,
    to: RESTARTING,
  },
  {
    name: EV_RESTARTED,
    from: RESTARTING,
    to: SUCCESS,
  },
];

export default transitions;
